import { system, BlockPermutation } from "@minecraft/server";

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_axe", {
        onUseOn(event) {
            const { block } = event;
            if (!block) return;
            const id = block.typeId;
            const dim = block.dimension;
            const loc = block.location;
            /*原木と対応する剥皮ブロック */
            const stripMap = {
                "minecraft:oak_log": "minecraft:stripped_oak_log",
                "minecraft:spruce_log": "minecraft:stripped_spruce_log",
                "minecraft:birch_log": "minecraft:stripped_birch_log",
                "minecraft:jungle_log": "minecraft:stripped_jungle_log",
                "minecraft:acacia_log": "minecraft:stripped_acacia_log",
                "minecraft:dark_oak_log": "minecraft:stripped_dark_oak_log",
                "minecraft:mangrove_log": "minecraft:stripped_mangrove_log",
                "minecraft:cherry_log": "minecraft:stripped_cherry_log",
                "minecraft:pale_oak_log": "minecraft:stripped_pale_oak_log",
                "minecraft:crimson_stem": "minecraft:stripped_crimson_stem",
                "minecraft:warped_stem": "minecraft:stripped_warped_stem",
                "minecraft:oak_wood": "minecraft:stripped_oak_wood",
                "minecraft:spruce_wood": "minecraft:stripped_spruce_wood",
                "minecraft:birch_wood": "minecraft:stripped_birch_wood",
                "minecraft:jungle_wood": "minecraft:stripped_jungle_wood",
                "minecraft:acacia_wood": "minecraft:stripped_acacia_wood",
                "minecraft:dark_oak_wood": "minecraft:stripped_dark_oak_wood",
                "minecraft:mangrove_wood": "minecraft:stripped_mangrove_wood",
                "minecraft:cherry_wood": "minecraft:stripped_cherry_wood",
                "minecraft:pale_oak_wood": "minecraft:stripped_pale_oak_wood",
                "minecraft:crimson_hyphae": "minecraft:stripped_crimson_hyphae",
                "minecraft:warped_hyphae": "minecraft:stripped_warped_hyphae",
                "minecraft:bamboo_block": "minecraft:stripped_bamboo_block",
            };
            if (!(id in stripMap)) return;
            const axis = block.permutation.getState("pillar_axis");
            const newPerm = BlockPermutation.resolve(stripMap[id], {
                "pillar_axis": axis
            });
            dim.getBlock(loc).setPermutation(newPerm);
            dim.runCommand(
                `playsound item.axe.strip @a ${loc.x + 0.5} ${loc.y + 0.5} ${loc.z + 0.5}`
            );
        }
    });
});