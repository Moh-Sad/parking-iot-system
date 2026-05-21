import { prisma } from '../lib/prisma.js';
import { generateCardNumber4 } from '../lib/uid.js';

export async function issueCardForVehicle(vehicleId: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = generateCardNumber4();
    try {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { cardNumber: candidate },
      });
      return candidate;
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === 'P2002') continue;
      throw e;
    }
  }
  throw new Error('Could not allocate a unique card number after 50 attempts');
}
