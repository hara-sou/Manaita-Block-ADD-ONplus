import { system, EquipmentSlot } from "@minecraft/server";
import { incBlk, noIncList } from "./config";

system.beforeEvents.startup.subscribe(ev => {

    const component = {
        // 共通処理: アイテムが増やせないかどうかの判定
        isBlocked(itemId) {
            return noIncList().includes(itemId);
        },
        // 共通処理: アイテムの複製とスポーン
        duplicateItems(itemStack, block, dimension) {
            const multiplier = incBlk[block.typeId] ?? 1;
            const maxStackSize = itemStack.getMaxStackSize?.() ?? 64;

            const spawnLocation = {
                x: block.location.x + 0.5,
                y: block.location.y + 0.5,
                z: block.location.z + 0.5
            };

            let remaining = multiplier;

            while (remaining > 0) {
                const spawnAmount = Math.min(remaining, maxStackSize);

                for (let i = 0; i < spawnAmount; i++) {
                    const cloned = itemStack.clone();
                    cloned.amount = 1;
                    dimension.spawnItem(cloned, spawnLocation);
                }

                remaining -= spawnAmount;
            }
        },
        // ブロックにアイテムが落ちたときの処理
        onEntityFallOn({ entity, block }) {
            if (!entity || !block || !incBlk[block.typeId]) return;
            if (!entity.hasComponent("minecraft:item")) return;

            const { itemStack } = entity.getComponent("minecraft:item");

            if (component.isBlocked(itemStack.typeId)) {
                const players = block.dimension.getPlayers();
                return;
            }

            component.duplicateItems(itemStack, block, entity.dimension);
        },

        // プレイヤーがブロックを右クリックしたときの処理
        onPlayerInteract(event) {
            const player = event.player;
            const block = event.block;

            const equippable = player.getComponent("minecraft:equippable");
            if (!equippable) return;

            const item = equippable.getEquipment(EquipmentSlot.Mainhand);
            if (!item) {
                player.sendMessage("§c[error]アイテムを持っていません。");
                return;
            }

            if (component.isBlocked(item.typeId)) {
                player.sendMessage(`§c[error]${item.typeId}は増やせません。`);
                return;
            }

            try {
                component.duplicateItems(item, block, player.dimension);
            } catch (e) {
                player.sendMessage("§c[error]複製に失敗しました。");
            }
        }
    };

    ev.blockComponentRegistry.registerCustomComponent(
        "hraddons:manaita_blocks",
        component
    );
});