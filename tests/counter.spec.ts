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
    let packageId="0x99a26c6c92e54e975dfbb4f35dab6f2661f1c82702af50e8f015dca57f8cde57";//? place your package id here
    let objectId:string

    beforeAll(async () => {
        client = new SuiClient({ url: getFullnodeUrl('localnet') });
        let keypairData = JSON.parse(readFileSync(join(os.homedir(), ".sui/sui_config/sui.keystore")).toString());
        const decoded = Buffer.from(keypairData[0], "base64").subarray(1);
        keypair = Ed25519Keypair.fromSecretKey(decoded);

    });



    it("createCounter", async () => {
        objectId=""
        const tx = new Transaction();

        tx.moveCall({
            arguments: [],
            target: `${packageId}::counter::create`,
        });

        let res=await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        const { effects } = await client.waitForTransaction({
            digest: res.digest,
            options: {
                showEffects: true,
            },
        });
        objectId=effects?.created?.[0]?.reference?.objectId!
        console.log(objectId)
        const objectData = await client.getObject({
            id: objectId,
            options: {
                showContent: true,
                showType: true,
                showOwner: true,
            },
        });
        console.log(objectData.data?.content)

    });
    it("increment", async () => {

        const tx = new Transaction();

        tx.moveCall({
            arguments: [tx.object(objectId)],
            target: `${packageId}::counter::increment`,
        });


        let res=await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        await client.waitForTransaction({
            digest: res.digest,
            options: {
                showEffects: true,
            },
        });

        const objectData = await client.getObject({
            id: objectId,
            options: {
                showContent: true,
                showType: true,
                showOwner: true,
            },
        });

        if (objectData.data?.content?.dataType === "moveObject") {
            const moveObject = objectData.data?.content as { fields: Record<string, any> };
            console.log("Move Object Fields:", moveObject.fields);
            expect(moveObject.fields["value"]).toBe("1");

        } else {
            console.log("Content does not have fields.");
        }

    });
    it("set", async () => {

        const tx = new Transaction();

        tx.moveCall({
            arguments: [tx.object(objectId),tx.pure.u64(10)],
            target: `${packageId}::counter::set_value`,
        });


        let res=await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        await client.waitForTransaction({
            digest: res.digest,
            options: {
                showEffects: true,
            },
        });

        const objectData = await client.getObject({
            id: objectId,
            options: {
                showContent: true,
                showType: true,
                showOwner: true,
            },
        });

        if (objectData.data?.content?.dataType === "moveObject") {
            const moveObject = objectData.data?.content as { fields: Record<string, any> };
            console.log("Move Object Fields:", moveObject.fields);
            expect(moveObject.fields["value"]).toBe("10");

        } else {
            console.log("Content does not have fields.");
        }

    });
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