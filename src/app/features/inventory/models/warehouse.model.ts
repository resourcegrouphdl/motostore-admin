export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  address?: string;
  publicFacing: boolean;
  active: boolean;
  audit: { createdAt: string; updatedAt: string; createdBy: string; updatedBy: string };
}
