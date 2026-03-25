import { world } from "@minecraft/server";

export const incBlk = {
    "hraddons:manaita_block_wooden": 1,
    "hraddons:manaita_block_stone": 2,
    "hraddons:manaita_block_iron": 3,
    "hraddons:manaita_block_golden": 4,
    "hraddons:manaita_block_diamond": 5,
    "hraddons:manaita_block_emerald": 6,
    "hraddons:manaita_block_netherite": 7
    // incBlk = Increased number of blocks の短略化
    // ブロックによって増えるアイテムの数
};

export const incClk = {
    "hraddons:manaita_click_wooden": 1,
    "hraddons:manaita_click_stone": 2,
    "hraddons:manaita_click_iron": 3,
    "hraddons:manaita_click_golden": 4,
    "hraddons:manaita_click_diamond": 5,
    "hraddons:manaita_click_emerald": 6,
    "hraddons:manaita_click_netherite": 7
    // incClk = Increased number of clicks の短略化
    // アイテムによって増えるブロックの数
}

export const noIncItems = [
    "minecraft:bedrock",
    "minecraft:end_portal_frame",
    "minecraft:command_block",
    "minecraft:chain_command_block",
    "minecraft:repeating_command_block",
    "minecraft:barrier",
    "minecraft:fire",
    "minecraft:soul_fire"
    // noIncItems = Items that cannot be increased の短略化
    // 増やせないアイテムのIDリスト
];

// noIncList = noIncItemsを動的プロパティで保存するための関数、noIncItemsは初期値として使用される
export function noIncList(){
    let data = world.getDynamicProperty("noIncList");
    if(!data){
        data = JSON.stringify(noIncItems);
        world.setDynamicProperty("noIncList", data);
    }
    return JSON.parse(data);
}
export function saveList(list){
    world.setDynamicProperty("noIncList", JSON.stringify(list));
}