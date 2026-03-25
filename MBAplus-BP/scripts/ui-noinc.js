import { system, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { noIncList, saveList } from "./config.js";

// コマンド登録
system.beforeEvents.startup.subscribe(ev => {
    const configCommand = {
        name: "hraddons:noinc",
        description: "「まな板アドオン+」の増やせないアイテムのリストを管理します。",
        permissionLevel: CommandPermissionLevel.Admin,// 管理者権限のみ コマブロ不可
        mandatoryParameters: [],
        optionalParameters: [],
    }
    ev.customCommandRegistry.registerCommand(configCommand, noinc)
});

function noinc(origin){
    if(origin.sourceEntity?.typeId !=="minecraft:player"){
        // プレイヤー以外がコマンドを実行した場合の処理
        return{
            status: CustomCommandStatus.Failure,//失敗
            message: "[error]このコマンドはプレイヤーのみ使用できます"
        }
    }
    const player = origin.sourceEntity;
    system.run(() => // system.runがないとエラー発生
        {openMainUI(player);
    });
    // コマンドの実行が成功した場合の処理
    return{
        status: CustomCommandStatus.Success,//成功
        message: undefined,// メッセージなし
    }
}

// メインUI
function openMainUI(player){
    const form = new ActionFormData()
    .title("増やせないアイテムリスト")
    .body("操作を選択してください")
    .button("追加")
    .button("削除")
    .button("リストを見る")
    .button("§c初期化");

        form.show(player).then(res => {
            if(res.canceled) return;
            switch(res.selection){
                case 0:
                    openAddUI(player);
                    break;
                case 1:
                    openRemoveUI(player);
                    break;
                case 2:
                    openListUI(player);
                    break;
                case 3:
                    openResetConfigUI(player);
                    break;
            }
        });
}

// 追加UI
function openAddUI(player){
    const form = new ModalFormData()
    .title("アイテムの追加")
    .textField("アイテムのIDを入力してください", "minecraft:stone")
    form.show(player).then(res => {
        if(res.canceled){
            openMainUI(player);
            return;
        }
        let id = res.formValues[0];
        if(!id || id.trim() === ""){
            player.sendMessage("§c[error]アイテムIDが入力されていません");
            return;
        }
        id = id.trim();// 前後の空白を削除
        const list = noIncList();

        if(!list.includes(id)){
            list.push(id);
            saveList(list);
            player.sendMessage(`§a[log]${id}を増やせないアイテムリストに追加しました`);
        } else {
            player.sendMessage(`§c[error]${id}は既に増やせないアイテムリストに含まれています`);
        }
    });
}

// 削除UI
function openRemoveUI(player){
    const list = noIncList();
    if(list.length === 0){
        player.sendMessage("§c[error]増やせないアイテムは現在ありません");
        return;
    }

    const form = new ActionFormData()
        .title("削除するアイテムを選択");
    list.forEach(id => form.button(id));

    form.show(player).then(res => {
        if(res.canceled){
            openMainUI(player);
            return;
        }

        switch(res.selection){
            default:
                const removed = list[res.selection];
                list.splice(res.selection, 1);
                saveList(list);
                player.sendMessage(`§a[log]${removed}を増やせないアイテムリストから削除しました`);
                break;
        }
    });
}

// 一覧UI
function openListUI(player){
    const form = new ActionFormData()
    form.title(`増やせないアイテムリスト(${noIncList().length})`);
    const listText = noIncList().map(id => `・${id}`).join("\n");
    form.body(listText.length > 0 ? listText : "§c[error]現在、増やせないアイテムはありません");
    form.show(player).then(res => {
        if(res.canceled){
            openMainUI(player);
            return;
        }
    });
}

// 初期化UI
const noIncItems = [ // 初期化した際に初期値に戻す
    "minecraft:bedrock",
    "minecraft:end_portal_frame",
    "minecraft:command_block",
    "minecraft:chain_command_block",
    "minecraft:repeating_command_block",
    "minecraft:barrier",
    "minecraft:fire",
    "minecraft:soul_fire"
];

function openResetConfigUI(player){
    const form = new MessageFormData()
        .title("§cリストの初期化")
        .body("本当に増やせないアイテムリストを初期化しますか？")
        .button1("キャンセル")
        .button2("初期化する");

    form.show(player).then(res => {
        if(res.canceled){
            openMainUI(player);
            return;
        }

        if(res.selection === 1){
            resetList(player);
        } else {
            openMainUI(player);
        }
    })

    function resetList(player){
        saveList([...noIncItems]);
        player.sendMessage("§a[log]増やせないアイテムリストを初期化しました");
        openMainUI(player);
    }
}