import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { noIncList } from "../config.js";

function show_main_form(player){
    const form = new ActionFormData();
    form.title("まな板ブロックアドオン+ 取扱説明書");
    form.button("クリックまな板・まな板ブロック", "textures/items/items/manaita_click_wooden");
    form.button("まな板ツール", "textures/items/equipment/manaita_axe");
    form.button("まな板防具", "textures/items/equipment/armor/manaita_helmet");
    form.button("追加アイテム", "textures/items/items/manaita_material");
    form.button("増やせないアイテムリスト","textures/blocks/barrier");
    form.button("アドオン情報","textures/MBAplus_pack_icon");
    form.button("アップデートログ(v4.3.0)")
    form.show(player).then((response) => {
        switch(response.selection){
            case 0:
                show_block_form(player);
                break;
            case 1:
                show_tool_form(player);
                break;
            case 2:
                show_armor_form(player);
                break;
            case 3:
                show_item_form(player);
                break;
            case 4:
                show_noItem_form(player);
                break;
            case 5:
                show_info_form(player);
                break;
            case 6:
                show_update_form(player);
                break;
        }
    }).catch(error =>
        player.sendMessage("An error occurred: " + error.message)
    );
}

function show_block_form(player){
    const form = new ActionFormData();
    form.title("クリックまな板・まな板ブロックについて");
    form.body({translate: "form.block.body"});
    form.button("戻る");
    form.show(player).then((response) => {
        if(response.selection === 0){
            show_main_form(player);
        }
    });
}

function show_tool_form(player){
    const form = new ActionFormData();
    form.title("まな板ツールについて");
    form.body({
        rawtext: [
            {translate: "form.tool_sword.body"},
            {text: "\n\n"},
            {translate: "form.tool_bow.body"},
            {text: "\n\n"},
            {translate: "form.tool_axe.body"},
            {text: "\n\n"},
            {translate: "form.tool_pickaxe.body"},
            {text: "\n\n"},
            {translate: "form.tool_shovel.body"},
            {text: "\n\n"},
            {translate: "form.tool_hoe.body"},
            {text: "\n\n"},
            {translate: "form.tool_paxel.body"}
        ]
    });
    form.button("戻る");
        form.show(player).then((response) => {
        if(response.selection === 0){
            show_main_form(player);
        }
    });
}

function show_armor_form(player){
    const form =new ActionFormData();
    form.title("まな板防具について");
    form.body({
        rawtext: [
            {translate: "form.armor_helmet.body"},
            {text: "\n\n"},
            {translate: "form.armor_chestplate.body"},
            {text: "\n\n"},
            {translate: "form.armor_leggings.body"},
            {text: "\n\n"},
            {translate: "form.armor_boots.body"}
        ]
    });
    form.button("戻る");
    form.show(player).then((response) => {
        if(response.selection === 0){
            show_main_form(player);
        }
    });
}

function show_item_form(player){
    const form =new ActionFormData();
    form.title("追加アイテムについて");
    form.body({translate: "form.item.body"});
    form.button("戻る");
    form.show(player).then((response) => {
        if(response.selection === 0){
            show_main_form(player);
        }
    });
}

function show_noItem_form(player){
    const form = new ActionFormData();
    form.title("増やせないアイテムリスト");
    const listText = noIncList().map(id => `・${id}`).join("\n");
    form.body(
        "以下のブロック・アイテムは増やすことができません。\n\n" +
        listText
    );
    form.button("戻る");
    form.show(player).then((response) => {
        if(response.selection === 0){
            show_main_form(player);
        }
    });
}

function show_info_form(player){
    const form = new ActionFormData();
    form.title("アドオン情報");
    form.body({translate: "form.info.body"});
    form.button("戻る");
    form.show(player).then((response) => {
        if(response.selection === 0){
            show_main_form(player);
        }
    });
}

function show_update_form(player){
    const form = new ActionFormData();
    form.title("アップデートログ");
    form.body({translate: "form.update.body"});
    form.button("戻る");
    form.show(player).then((response) => {
        if(response.selection === 0){
            show_main_form(player);
        }
    });
}

world.afterEvents.itemUse.subscribe(ev => {
    if(ev.itemStack.typeId == "hraddons:manaita_operating_instructions"){
        let player = ev.source;
        show_main_form(player);
    }
});