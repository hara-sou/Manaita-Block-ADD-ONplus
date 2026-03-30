import { world } from "@minecraft/server";

/*飛行用モジュール*/
const flyingPlayers = new Set();
world.afterEvents.itemUse.subscribe(ev => {
    if (ev.itemStack.typeId === "hraddons:manaita_module_fly") {
    const player = ev.source;
    try{
        if(!flyingPlayers.has(player.id)){
        // OFF -> ON
        player.runCommand("ability @s mayfly true");
        flyingPlayers.add(player.id);
        } else {
        // ON -> OFF
        player.runCommand("ability @s mayfly false");
        flyingPlayers.delete(player.id);
        }
        } catch {
        player.sendMessage("§c[error]このアイテムは現在使用できません。権限またはMinecraft Educationがオンになっているかを確認してください。");
        }
    }
});