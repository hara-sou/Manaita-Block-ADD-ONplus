import { system, world, EquipmentSlot } from "@minecraft/server";

/*オーブ生成*/
system.runInterval(() => {
    for (const player of world.getPlayers()) {
    const equip = player.getComponent("equippable");
    if (!equip) continue;
    const offhand = equip.getEquipment(EquipmentSlot.Offhand);
    if (!offhand || offhand.typeId !== "hraddons:manaita_xp_card_orb") continue;
    player.dimension.spawnEntity("minecraft:xp_orb", player.location);
    }
}, 1);

/*経験値リセット*/
world.afterEvents.itemUse.subscribe(ev => {
    if(ev.itemStack.typeId == "hraddons:manaita_xp_card"){
    ev.source.runCommand("xp -24791L @s")
    ev.source.sendMessage("§a" + ev.source.name + "の経験値をリセットしました")
    }
});