import { system, BlockPermutation, ItemStack } from "@minecraft/server";

// 耕す
const hoe = {
    "minecraft:dirt": "minecraft:farmland",
    "minecraft:grass_block": "minecraft:farmland",
    "minecraft:grass_path": "minecraft:farmland",
    "minecraft:coarse_dirt": "minecraft:dirt", // 粗い土 -> 土
    "minecraft:dirt_with_roots": "minecraft:dirt" //根付いた土 -> 土
};

// 道にする
const shovel = {
    "minecraft:grass_block": "minecraft:grass_path",
    "minecraft:dirt": "minecraft:grass_path",
    "minecraft:coarse_dirt": "minecraft:grass_path",
    "minecraft:dirt_with_roots": "minecraft:grass_path",
    "minecraft:podzol": "minecraft:grass_path",
    "minecraft:mycelium": "minecraft:grass_path",
};

system.beforeEvents.startup.subscribe(({itemComponentRegistry}) => {
    itemComponentRegistry.registerCustomComponent("hraddons:hoe_shovel", {
        onUseOn(event){
            const { source, block, usedOnBlockPermutation } = event;
            if(!block || !source) return;

            const currentTypeId = usedOnBlockPermutation?.type.id ?? block.typeId;

            // スニーク中 -> shovel /立っている -> hoe
            const table = source.isSneaking ? shovel : hoe;
            const nextTypeId = table[currentTypeId];

            if(!nextTypeId) return; // 対象外ブロックなら何もしない
            // 根付いた土をクワで耕すと垂れ根をドロップ
            if(!source.isSneaking && currentTypeId === "minecraft:dirt_with_roots"){
                const dropLocation = {
                    x: block.location.x + 0.5,
                    y: block.location.y + 1,
                    z: block.location.z + 0.5,
                };
                block.dimension.spawnItem(new ItemStack("minecraft:hanging_roots", 1), dropLocation);
            }

            block.setPermutation(BlockPermutation.resolve(nextTypeId));

            const sound = source.isSneaking ? "use.grass" : "use.gravel";// シャベル:クワ
            block.dimension.playSound(sound, block.location);
        },
    });
});