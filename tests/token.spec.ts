import {getFullnodeUrl, SuiClient, SuiObjectData} from '@mysten/sui/client';
import { readFileSync } from "fs";
import { join } from "path";
import os from "os";


import { execSync } from "node:child_process";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

describe('Ico', () => {
    let client: SuiClient;
    let keypair: Ed25519Keypair;
    let packageId="0xf8393f960852bb5fe169e97f5edf019ca7f230c27d10baffbb9002360804cbc4";//? place your package id here
    let objectId:string

    beforeAll(async () => {
        client = new SuiClient({ url: getFullnodeUrl('localnet') });
        let keypairData = JSON.parse(readFileSync(join(os.homedir(), ".sui/sui_config/sui.keystore")).toString());
        const decoded = Buffer.from(keypairData[0], "base64").subarray(1);
        keypair = Ed25519Keypair.fromSecretKey(decoded);

    });


//
//     it("mint token", async () => {
//         objectId=""
//         const tx = new Transaction();
//
//
//         let treasuryCapObjectType=`0x2::coin::TreasuryCap<${packageId}::tusdt::TUSDT>`
//         const treasuryCapObjectData = await client.getOwnedObjects({
//             owner:keypair.toSuiAddress(),
//             filter: {
//                 StructType: treasuryCapObjectType,
//             },
//
//             options: {
//                 showContent: true,
//                 showType: true,
//                 showOwner: true,
//             },
//         });
//         let treasuryCap=treasuryCapObjectData.data[0].data?.objectId!
//
//         tx.moveCall({
//             target: `${packageId}::tusdt::mint`,
//             arguments: [
//                 tx.object(treasuryCap), // The TreasuryCap<TUSDT> object ID
//                 tx.pure.u64(1000000),           // amount
//                 tx.pure.address(keypair.toSuiAddress()), // recipient address
//             ],
//         });
//
// //
//
//         const result = await client.signAndExecuteTransaction({
//             transaction: tx,
//             signer: keypair,
//             options: {
//                 showEffects: true,
//                 showObjectChanges: true,
//             },
//
//         });
//         let objectType=`0x2::coin::Coin<${packageId}::tusdt::TUSDT>`
//         const objectData = await client.getOwnedObjects({
//             owner:keypair.toSuiAddress(),
//             filter: {
//                 StructType: objectType,
//             },
//
//             options: {
//                 showContent: true,
//                 showType: true,
//                 showOwner: true,
//             },
//         });
//
//         let totalBalance = 0n;
//         for (const obj of objectData.data) {
//             const fields = (obj.data?.content as any)?.fields;
//             if (fields && fields.balance) {
//                 totalBalance += BigInt(fields.balance);
//             }
//         }
//         console.log("balance :",totalBalance)
//
//     });
    it("transfer token", async () => {
        const objectType = `${packageId}::tusdt::TUSDT`;

// Get TUSDT coin
        const coins = await client.getCoins({
            owner: "0xf8393f960852bb5fe169e97f5edf019ca7f230c27d10baffbb9002360804cbc4",
            coinType: objectType,
        });
        const coinObjectId = coins.data[0].coinObjectId;

// Optional: fetch gas coin manually (only if needed)
//         const gasCoins = await client.getGasCoinsOwnedByAddress(keypair.toSuiAddress());
//         const gasCoinId = gasCoins[0]?.coinObjectId;

        let tx = new Transaction();

// Use tx.object to wrap coinObjectId
        const [myTokenPart] = tx.splitCoins(tx.object(coinObjectId), [1000]);

// Transfer token
        tx.transferObjects(
            [myTokenPart],
            '0xe43ccc57ad57e9eb932f1684c1c79fd4968aecf81e035cfb584924a1c1f62bb0'
        );


        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
        });

        console.log('✅ Transfer result:', result);

        const userBalance = await client.getCoins({
            owner: "0xe43ccc57ad57e9eb932f1684c1c79fd4968aecf81e035cfb584924a1c1f62bb0",
            coinType: objectType,
        });

        console.log(userBalance.data)

    });
    // it("set", async () => {
    //
    //     const tx = new Transaction();
    //
    //     tx.moveCall({
    //         arguments: [tx.object(objectId),tx.pure.u64(10)],
    //         target: `${packageId}::counter::set_value`,
    //     });
    //
    //
    //     let res=await client.signAndExecuteTransaction({
    //         transaction: tx,
    //         signer: keypair,
    //         options: {
    //             showEffects: true,
    //             showObjectChanges: true,
    //         },
    //     });
    //
    //     await client.waitForTransaction({
    //         digest: res.digest,
    //         options: {
    //             showEffects: true,
    //         },
    //     });
    //
    //     const objectData = await client.getObject({
    //         id: objectId,
    //         options: {
    //             showContent: true,
    //             showType: true,
    //             showOwner: true,
    //         },
    //     });
    //
    //     if (objectData.data?.content?.dataType === "moveObject") {
    //         const moveObject = objectData.data?.content as { fields: Record<string, any> };
    //         console.log("Move Object Fields:", moveObject.fields);
    //         expect(moveObject.fields["value"]).toBe("10");
    //
    //     } else {
    //         console.log("Content does not have fields.");
    //     }
    //
    // });
});


async function getFreshGas(client: SuiClient, address: string) {
    const coins = await client.getCoins({ owner: address });
    if (coins.data.length === 0) {
        throw new Error('No coins found for gas.');
    }
    const coin = coins.data[0];
    return {
        objectId: coin.coinObjectId,
        version: coin.version,
        digest: coin.digest,
    };
}


function getCounterFields(data: SuiObjectData) {
    if (data.content?.dataType !== "moveObject") {
        return null;
    }

    return data.content.fields as { value: number; owner: string };
}
