// import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
// import { readFileSync } from "fs";
// import { join } from "path";
// import os from "os";
// import { execSync } from "node:child_process";
// import { Transaction } from "@mysten/sui/transactions";
// import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
//
// function create(counterPackageId:string) {
//     const tx = new Transaction();
//
//     tx.moveCall({
//         arguments: [],
//         target: `${counterPackageId}::counter::create`,
//     });
//
//     signAndEx(
//         {
//             transaction: tx,
//         },
//         {
//             onSuccess: async ({ digest }) => {
//                 const { effects } = await suiClient.waitForTransaction({
//                     digest: digest,
//                     options: {
//                         showEffects: true,
//                     },
//                 });
//
//                 onCreated(effects?.created?.[0]?.reference?.objectId!);
//             },
//         },
//     );
// }
