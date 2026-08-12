import { system } from "@minecraft/server";
import { MassDestruction } from "./chainBreak";

/* 耕して farmland に変換できる対象ブロック */
const pathTargets = [
    "minecraft:dirt",
    "minecraft:grass_block",
    "minecraft:grass_path",
    "minecraft:coarse_dirt"
];

/**
 * 一括破壊の対象を絞り込むためのブロックタグ。
 * このタグを持たないブロックを破壊しても連鎖処理は行わない。
 */
const DESTRUCTIBLE_TAG = "minecraft:is_hoe_item_destructible";

// ワールド起動時にカスタムアイテムコンポーネントを登録する
system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_hoe", {

        /**
         * 右クリックでブロックに使用した時の処理。
         * 土・草ブロックの上が空いていれば、farmland（農地）に変換する。
         */
        onUseOn(event) {
            const { block } = event;
            if (!block) return;

            const dim = block.dimension;
            const loc = block.location;
            const id = block.typeId;

            // 対象外のブロックなら何もしない
            if (!pathTargets.includes(id)) return;

            // 真上にブロックがある場合は耕せない（バニラの挙動に合わせる）
            const above = dim.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
            if (above && above.typeId !== "minecraft:air") return;

            dim.runCommand(
                `fill ${loc.x} ${loc.y} ${loc.z} ${loc.x} ${loc.y} ${loc.z} minecraft:farmland`
            );
        },

        /**
         * ブロックを破壊した時の処理。
         * 破壊したブロックが「is_hoe_item_destructible」タグを持つ場合のみ、
         * 隣接する（斜めも含む）同じブロックを連鎖的に破壊する。
         */
        onMineBlock(event) {
            const { block, minedBlockPermutation } = event;
            if (!block) return;

            // タグを持たないブロックは対象外にする
            if (!minedBlockPermutation.hasTag(DESTRUCTIBLE_TAG)) return;

            const targetTypeId = minedBlockPermutation.type.id;

            // 起点ブロック自体はプレイヤーの操作で既に破壊済みなので、
            // 周囲26方向それぞれを起点としてBFS連鎖破壊を開始する
            MassDestruction(block.dimension, block.location, targetTypeId);
        },
    });
});