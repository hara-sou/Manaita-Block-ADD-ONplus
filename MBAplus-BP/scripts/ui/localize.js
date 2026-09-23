import { ItemStack, BlockPermutation } from "@minecraft/server";

export function localizedName(id){
    try{
        // アイテムの翻訳キーのtextを作る
        const key = new ItemStack(id).localizationKey;
        return { translate: key };
    } catch {
        try{
            // アイテムで作れなかったらブロックで作る
            const key = BlockPermutation.resolve(id).localizationKey;
            return { translate: key };
        } catch {
            // どちらも取れないとIDをそのまま表示
            return { text: id };
        }
    }
}