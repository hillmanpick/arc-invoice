import { createPublicClient, http, getAddress, isAddress, zeroAddress } from 'viem';
import { arc } from './arc';
export const rpc = createPublicClient({
  chain: arc,
  transport: http(process.env.ARC_RPC_URL || arc.rpcUrls.default.http[0], { timeout: 12000, retryCount: 1 }),
});
export function merchantAddress() {
  const address = process.env.MERCHANT_ADDRESS || '';
  if (!isAddress(address) || address.toLowerCase() === zeroAddress) throw new Error('请先配置有效的 MERCHANT_ADDRESS 收款地址。');
  return getAddress(address);
}
export async function checkRecipient(address: `0x${string}`) {
  if (await rpc.getChainId() !== arc.id) throw new Error('RPC 不是 Arc 主网。');
  if ((await rpc.getCode({ address }) || '0x') !== '0x') throw new Error('此版本仅支持普通钱包收款地址，请使用没有合约代码的钱包。');
  return address;
}
