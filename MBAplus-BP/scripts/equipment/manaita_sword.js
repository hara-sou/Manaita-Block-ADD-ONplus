import { system } from "@minecraft/server";
import { MassDestruction } from "./chainBreak";

const DESTRUCTIBLE_TAG = "minecraft:is_sword_item_destructible";


system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_sword", {
        onMineBlock(event) {
            const { block, minedBlockPermutation } = event;
            if (!block) return;
            if (!minedBlockPermutation.hasTag(DESTRUCTIBLE_TAG)) return;
            const targetTypeId = minedBlockPermutation.type.id;

            MassDestruction(block.dimension, block.location, targetTypeId);
        }
    })
})