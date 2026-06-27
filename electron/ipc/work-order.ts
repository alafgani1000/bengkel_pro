import { ipcMain } from 'electron';
import { prisma } from '../lib/db';

export function registerWorkOrderIPC() {
  ipcMain.handle('work-order:list', async (_, filters) => {
    return prisma.workOrder.findMany({
      where: filters,
      include: {
        customer: true,
        kendaraan: true,
        mekanik: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  ipcMain.handle('work-order:get', async (_, { id }) => {
    return prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        kendaraan: true,
        mekanik: true,
        items: {
          include: {
            sparepart: true,
          },
        },
        invoice: true,
      },
    });
  });

  ipcMain.handle('work-order:create', async (_, data) => {
    try {
      console.log('Creating SPK with data:', data);
      
      // Generate nomor SPK: SPK-YYYYMMDD-XXXX
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await prisma.workOrder.count({
        where: {
          nomorSPK: { startsWith: `SPK-${date}` },
        },
      });
      const nomorSPK = `SPK-${date}-${String(count + 1).padStart(4, '0')}`;
      console.log('Generated nomorSPK:', nomorSPK);

      // Handle Customer
      let customer = await prisma.customer.findUnique({ where: { phone: data.customerPhone } });
      if (!customer) {
        console.log('Creating new customer:', data.customerName, data.customerPhone);
        customer = await prisma.customer.create({
          data: { name: data.customerName, phone: data.customerPhone },
        });
      }

      // Handle Kendaraan
      let kendaraan = await prisma.kendaraan.findUnique({ where: { platNomor: data.platNomor } });
      if (!kendaraan) {
        console.log('Creating new kendaraan:', data.platNomor);
        kendaraan = await prisma.kendaraan.create({
          data: {
            customerId: customer.id,
            platNomor: data.platNomor,
            merek: data.merk,
            model: data.tipe,
            tahun: '',
            warna: '',
            jenisKendaraan: 'MOBIL',
          },
        });
      }

      // Get a default mechanic (MVP logic)
      let mechanic = await prisma.user.findFirst({ where: { role: 'MEKANIK' } });
      if (!mechanic) {
        console.log('Falling back to any user for mechanic');
        mechanic = await prisma.user.findFirst(); // fallback
      }
      
      if (!mechanic) {
        throw new Error('Tidak ada data user/mekanik di database. Silakan jalankan seeding.');
      }

      console.log('Creating WorkOrder...');
      const wo = await prisma.workOrder.create({
        data: {
          nomorSPK,
          customerId: customer.id,
          kendaraanId: kendaraan.id,
          mekanikId: mechanic.id,
          keluhan: data.keluhan,
          status: 'ANTRI',
        },
      });
      console.log('WorkOrder created successfully:', wo.id);
      return wo;
    } catch (error: any) {
      console.error('work-order:create ERROR:', error);
      throw error;
    }
  });

  ipcMain.handle('work-order:update-status', async (_, { id, status }) => {
    const updateData: any = { status };
    if (status === 'DIKERJAKAN') {
      updateData.startedAt = new Date();
    } else if (status === 'SELESAI') {
      updateData.completedAt = new Date();
    } else if (status === 'DIAMBIL') {
      updateData.pickedUpAt = new Date();
    }
    
    const wo = await prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    // Auto-create invoice if SELESAI
    if (status === 'SELESAI') {
      const existingInvoice = await prisma.invoice.findUnique({ where: { workOrderId: id } });
      if (!existingInvoice) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await prisma.invoice.count({
          where: { nomorInvoice: { startsWith: `INV-${date}` } }
        });
        const nomorInvoice = `INV-${date}-${String(count + 1).padStart(4, '0')}`;
        
        await prisma.invoice.create({
          data: {
            nomorInvoice,
            workOrderId: id,
            customerId: wo.customerId,
            subtotal: wo.totalBiaya,
            total: wo.totalBiaya,
            status: 'BELUM_BAYAR'
          }
        });
      }
    }

    return wo;
  });

  ipcMain.handle('work-order:add-item', async (_, data: { workOrderId: string; type: string; nama: string; qty: number; hargaSatuan: number; sparepartId?: string }) => {
    const subtotal = data.qty * data.hargaSatuan;
    
    // Create the item
    const item = await prisma.workOrderItem.create({
      data: {
        workOrderId: data.workOrderId,
        type: data.type, // 'JASA' | 'SPAREPART'
        nama: data.nama,
        qty: data.qty,
        hargaSatuan: data.hargaSatuan,
        subtotal: subtotal,
        sparepartId: data.sparepartId,
      },
    });

    // Update work order totalBiaya
    await prisma.workOrder.update({
      where: { id: data.workOrderId },
      data: {
        totalBiaya: {
          increment: subtotal
        }
      }
    });

    // Also update invoice if it exists
    const inv = await prisma.invoice.findUnique({ where: { workOrderId: data.workOrderId } });
    if (inv) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          subtotal: { increment: subtotal },
          total: { increment: subtotal }
        }
      });
    }

    // Deduct stock if it's a sparepart
    if (data.type === 'SPAREPART' && data.sparepartId) {
      const sp = await prisma.sparepart.findUnique({ where: { id: data.sparepartId } });
      if (sp) {
        await prisma.sparepart.update({
          where: { id: data.sparepartId },
          data: { stokSaatIni: { decrement: data.qty } }
        });
        
        const admin = await prisma.user.findFirst();
        await prisma.stokMutasi.create({
          data: {
            sparepartId: data.sparepartId,
            type: 'KELUAR',
            qty: data.qty,
            qtyBefore: sp.stokSaatIni,
            qtyAfter: sp.stokSaatIni - data.qty,
            keterangan: `Digunakan untuk SPK (Auto Deduct)`,
            createdById: admin?.id || '', 
          }
        });
      }
    }

    return item;
  });

  ipcMain.handle('work-order:remove-item', async (_, { id }) => {
    // Find the item first
    const item = await prisma.workOrderItem.findUnique({ where: { id } });
    if (!item) throw new Error('Item not found');

    // Delete the item
    await prisma.workOrderItem.delete({ where: { id } });

    // Update work order totalBiaya
    await prisma.workOrder.update({
      where: { id: item.workOrderId },
      data: {
        totalBiaya: {
          decrement: item.subtotal
        }
      }
    });

    // Also update invoice if it exists
    const inv = await prisma.invoice.findUnique({ where: { workOrderId: item.workOrderId } });
    if (inv) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          subtotal: { decrement: item.subtotal },
          total: { decrement: item.subtotal }
        }
      });
    }

    // Restore stock if it's a sparepart
    if (item.type === 'SPAREPART' && item.sparepartId) {
      const sp = await prisma.sparepart.findUnique({ where: { id: item.sparepartId } });
      if (sp) {
        await prisma.sparepart.update({
          where: { id: item.sparepartId },
          data: { stokSaatIni: { increment: item.qty } }
        });
        
        const admin = await prisma.user.findFirst();
        await prisma.stokMutasi.create({
          data: {
            sparepartId: item.sparepartId,
            type: 'MASUK',
            qty: item.qty,
            qtyBefore: sp.stokSaatIni,
            qtyAfter: sp.stokSaatIni + item.qty,
            keterangan: `Dikembalikan dari penghapusan SPK (Auto Restore)`,
            createdById: admin?.id || '', 
          }
        });
      }
    }

    return true;
  });
}
