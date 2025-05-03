<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElRadioGroup, ElRadio, ElTooltip } from 'element-plus';

// 复制模式：emoji-直接复制表情，unicode-复制Unicode，bytes-复制字节码
const copyMode = ref('emoji');

// 追踪当前复制状态的emoji索引
const currentCopiedIndex = ref<{groupIndex: number, emojiIndex: number} | null>(null);

// 修复类型定义：将类型改为数组
const emojiGroups = ref<{ category: string; emojis: Array<{ emoji: string; unicode: string; bytes: string }> }[]>([]);

// 加载 emoji 数据
onMounted(() => {
  // 大幅增加表情符号数量和种类
  emojiGroups.value = [
  {
      category: '表情符号',
      emojis: [
        { emoji: '😀', unicode: 'U+1F600', bytes: '\\uD83D\\uDE00' },
        { emoji: '😁', unicode: 'U+1F601', bytes: '\\uD83D\\uDE01' },
        { emoji: '😂', unicode: 'U+1F602', bytes: '\\uD83D\\uDE02' },
        { emoji: '🤣', unicode: 'U+1F923', bytes: '\\uD83E\\uDD23' },
        { emoji: '😃', unicode: 'U+1F603', bytes: '\\uD83D\\uDE03' },
        { emoji: '😄', unicode: 'U+1F604', bytes: '\\uD83D\\uDE04' },
        { emoji: '😅', unicode: 'U+1F605', bytes: '\\uD83D\\uDE05' },
        { emoji: '😆', unicode: 'U+1F606', bytes: '\\uD83D\\uDE06' },
        { emoji: '😉', unicode: 'U+1F609', bytes: '\\uD83D\\uDE09' },
        { emoji: '😊', unicode: 'U+1F60A', bytes: '\\uD83D\\uDE0A' },
        { emoji: '😋', unicode: 'U+1F60B', bytes: '\\uD83D\\uDE0B' },
        { emoji: '😎', unicode: 'U+1F60E', bytes: '\\uD83D\\uDE0E' },
        { emoji: '😍', unicode: 'U+1F60D', bytes: '\\uD83D\\uDE0D' },
        { emoji: '😘', unicode: 'U+1F618', bytes: '\\uD83D\\uDE18' },
        { emoji: '🥰', unicode: 'U+1F970', bytes: '\\uD83E\\uDD70' },
        { emoji: '😗', unicode: 'U+1F617', bytes: '\\uD83D\\uDE17' },
        { emoji: '😙', unicode: 'U+1F619', bytes: '\\uD83D\\uDE19' },
        { emoji: '😚', unicode: 'U+1F61A', bytes: '\\uD83D\\uDE1A' },
        { emoji: '🙂', unicode: 'U+1F642', bytes: '\\uD83D\\uDE42' },
        { emoji: '🤗', unicode: 'U+1F917', bytes: '\\uD83E\\uDD17' },
        { emoji: '🤩', unicode: 'U+1F929', bytes: '\\uD83E\\uDD29' },
        { emoji: '🤔', unicode: 'U+1F914', bytes: '\\uD83E\\uDD14' },
        { emoji: '🤨', unicode: 'U+1F928', bytes: '\\uD83E\\uDD28' },
        { emoji: '😐', unicode: 'U+1F610', bytes: '\\uD83D\\uDE10' }
      ]
    },
    {
      category: '情绪和感受',
      emojis: [
        { emoji: '😑', unicode: 'U+1F611', bytes: '\\uD83D\\uDE11' },
        { emoji: '😶', unicode: 'U+1F636', bytes: '\\uD83D\\uDE36' },
        { emoji: '😏', unicode: 'U+1F60F', bytes: '\\uD83D\\uDE0F' },
        { emoji: '😒', unicode: 'U+1F612', bytes: '\\uD83D\\uDE12' },
        { emoji: '🙄', unicode: 'U+1F644', bytes: '\\uD83D\\uDE44' },
        { emoji: '😬', unicode: 'U+1F62C', bytes: '\\uD83D\\uDE2C' },
        { emoji: '🤥', unicode: 'U+1F925', bytes: '\\uD83E\\uDD25' },
        { emoji: '😌', unicode: 'U+1F60C', bytes: '\\uD83D\\uDE0C' },
        { emoji: '😔', unicode: 'U+1F614', bytes: '\\uD83D\\uDE14' },
        { emoji: '😪', unicode: 'U+1F62A', bytes: '\\uD83D\\uDE2A' },
        { emoji: '🤤', unicode: 'U+1F924', bytes: '\\uD83E\\uDD24' },
        { emoji: '😴', unicode: 'U+1F634', bytes: '\\uD83D\\uDE34' },
        { emoji: '😷', unicode: 'U+1F637', bytes: '\\uD83D\\uDE37' },
        { emoji: '🤒', unicode: 'U+1F912', bytes: '\\uD83E\\uDD12' },
        { emoji: '🤕', unicode: 'U+1F915', bytes: '\\uD83E\\uDD15' },
        { emoji: '🤢', unicode: 'U+1F922', bytes: '\\uD83E\\uDD22' },
        { emoji: '🤮', unicode: 'U+1F92E', bytes: '\\uD83E\\uDD2E' },
        { emoji: '🤧', unicode: 'U+1F927', bytes: '\\uD83E\\uDD27' },
        { emoji: '🥵', unicode: 'U+1F975', bytes: '\\uD83E\\uDD75' },
        { emoji: '🥶', unicode: 'U+1F976', bytes: '\\uD83E\\uDD76' },
        { emoji: '🥴', unicode: 'U+1F974', bytes: '\\uD83E\\uDD74' },
        { emoji: '😵', unicode: 'U+1F635', bytes: '\\uD83D\\uDE35' },
        { emoji: '🤯', unicode: 'U+1F92F', bytes: '\\uD83E\\uDD2F' },
        { emoji: '😕', unicode: 'U+1F615', bytes: '\\uD83D\\uDE15' }
      ]
    },
    {
      category: '手势',
      emojis: [
        { emoji: '👍', unicode: 'U+1F44D', bytes: '\\uD83D\\uDC4D' },
        { emoji: '👎', unicode: 'U+1F44E', bytes: '\\uD83D\\uDC4E' },
        { emoji: '👌', unicode: 'U+1F44C', bytes: '\\uD83D\\uDC4C' },
        { emoji: '👋', unicode: 'U+1F44B', bytes: '\\uD83D\\uDC4B' },
        { emoji: '✌️', unicode: 'U+270C', bytes: '\\u270C\\uFE0F' },
        { emoji: '🤞', unicode: 'U+1F91E', bytes: '\\uD83E\\uDD1E' },
        { emoji: '🤟', unicode: 'U+1F91F', bytes: '\\uD83E\\uDD1F' },
        { emoji: '🤘', unicode: 'U+1F918', bytes: '\\uD83E\\uDD18' },
        { emoji: '👊', unicode: 'U+1F44A', bytes: '\\uD83D\\uDC4A' },
        { emoji: '✊', unicode: 'U+270A', bytes: '\\u270A' },
        { emoji: '👏', unicode: 'U+1F44F', bytes: '\\uD83D\\uDC4F' },
        { emoji: '🙏', unicode: 'U+1F64F', bytes: '\\uD83D\\uDE4F' },
        { emoji: '🫶', unicode: 'U+1FAF6', bytes: '\\uD83E\\uDEF6' },
        { emoji: '🤝', unicode: 'U+1F91D', bytes: '\\uD83E\\uDD1D' },
        { emoji: '💪', unicode: 'U+1F4AA', bytes: '\\uD83D\\uDCAA' },
        { emoji: '🫰', unicode: 'U+1FAF0', bytes: '\\uD83E\\uDEF0' },
        { emoji: '👆', unicode: 'U+1F446', bytes: '\\uD83D\\uDC46' },
        { emoji: '👇', unicode: 'U+1F447', bytes: '\\uD83D\\uDC47' },
        { emoji: '👈', unicode: 'U+1F448', bytes: '\\uD83D\\uDC48' },
        { emoji: '👉', unicode: 'U+1F449', bytes: '\\uD83D\\uDC49' },
        { emoji: '👐', unicode: 'U+1F450', bytes: '\\uD83D\\uDC50' },
        { emoji: '🤲', unicode: 'U+1F932', bytes: '\\uD83E\\uDD32' },
        { emoji: '🖐️', unicode: 'U+1F590', bytes: '\\uD83D\\uDD90\\uFE0F' },
        { emoji: '🖖', unicode: 'U+1F596', bytes: '\\uD83D\\uDD96' }
      ]
    },
    {
      category: '动物',
      emojis: [
        { emoji: '🐶', unicode: 'U+1F436', bytes: '\\uD83D\\uDC36' },
        { emoji: '🐱', unicode: 'U+1F431', bytes: '\\uD83D\\uDC31' },
        { emoji: '🐭', unicode: 'U+1F42D', bytes: '\\uD83D\\uDC2D' },
        { emoji: '🐹', unicode: 'U+1F439', bytes: '\\uD83D\\uDC39' },
        { emoji: '🐰', unicode: 'U+1F430', bytes: '\\uD83D\\uDC30' },
        { emoji: '🦊', unicode: 'U+1F98A', bytes: '\\uD83E\\uDD8A' },
        { emoji: '🐻', unicode: 'U+1F43B', bytes: '\\uD83D\\uDC3B' },
        { emoji: '🐼', unicode: 'U+1F43C', bytes: '\\uD83D\\uDC3C' },
        { emoji: '🐨', unicode: 'U+1F428', bytes: '\\uD83D\\uDC28' },
        { emoji: '🐯', unicode: 'U+1F42F', bytes: '\\uD83D\\uDC2F' },
        { emoji: '🦁', unicode: 'U+1F981', bytes: '\\uD83E\\uDD81' },
        { emoji: '🐮', unicode: 'U+1F42E', bytes: '\\uD83D\\uDC2E' },
        { emoji: '🐷', unicode: 'U+1F437', bytes: '\\uD83D\\uDC37' },
        { emoji: '🐸', unicode: 'U+1F438', bytes: '\\uD83D\\uDC38' },
        { emoji: '🐵', unicode: 'U+1F435', bytes: '\\uD83D\\uDC35' },
        { emoji: '🐔', unicode: 'U+1F414', bytes: '\\uD83D\\uDC14' },
        { emoji: '🐧', unicode: 'U+1F427', bytes: '\\uD83D\\uDC27' },
        { emoji: '🐦', unicode: 'U+1F426', bytes: '\\uD83D\\uDC26' },
        { emoji: '🦆', unicode: 'U+1F986', bytes: '\\uD83E\\uDD86' },
        { emoji: '🦅', unicode: 'U+1F985', bytes: '\\uD83E\\uDD85' },
        { emoji: '🦉', unicode: 'U+1F989', bytes: '\\uD83E\\uDD89' },
        { emoji: '🦇', unicode: 'U+1F987', bytes: '\\uD83E\\uDD87' },
        { emoji: '🐺', unicode: 'U+1F43A', bytes: '\\uD83D\\uDC3A' },
        { emoji: '🐗', unicode: 'U+1F417', bytes: '\\uD83D\\uDC17' }
      ]
    },
    {
      category: '海洋动物',
      emojis: [
        { emoji: '🐳', unicode: 'U+1F433', bytes: '\\uD83D\\uDC33' },
        { emoji: '🐋', unicode: 'U+1F40B', bytes: '\\uD83D\\uDC0B' },
        { emoji: '🐬', unicode: 'U+1F42C', bytes: '\\uD83D\\uDC2C' },
        { emoji: '🦭', unicode: 'U+1F9AD', bytes: '\\uD83E\\uDDAD' },
        { emoji: '🐟', unicode: 'U+1F41F', bytes: '\\uD83D\\uDC1F' },
        { emoji: '🐠', unicode: 'U+1F420', bytes: '\\uD83D\\uDC20' },
        { emoji: '🐡', unicode: 'U+1F421', bytes: '\\uD83D\\uDC21' },
        { emoji: '🦈', unicode: 'U+1F988', bytes: '\\uD83E\\uDD88' },
        { emoji: '🐙', unicode: 'U+1F419', bytes: '\\uD83D\\uDC19' },
        { emoji: '🐚', unicode: 'U+1F41A', bytes: '\\uD83D\\uDC1A' },
        { emoji: '🪸', unicode: 'U+1FAB8', bytes: '\\uD83E\\uDEB8' },
        { emoji: '🦀', unicode: 'U+1F980', bytes: '\\uD83E\\uDD80' },
        { emoji: '🦞', unicode: 'U+1F99E', bytes: '\\uD83E\\uDD9E' },
        { emoji: '🦐', unicode: 'U+1F990', bytes: '\\uD83E\\uDD90' },
        { emoji: '🦑', unicode: 'U+1F991', bytes: '\\uD83E\\uDD91' },
        { emoji: '🦧', unicode: 'U+1F9A7', bytes: '\\uD83E\\uDDA7' }
      ]
    },
    {
      category: '水果',
      emojis: [
        { emoji: '🍎', unicode: 'U+1F34E', bytes: '\\uD83C\\uDF4E' },
        { emoji: '🍐', unicode: 'U+1F350', bytes: '\\uD83C\\uDF50' },
        { emoji: '🍊', unicode: 'U+1F34A', bytes: '\\uD83C\\uDF4A' },
        { emoji: '🍋', unicode: 'U+1F34B', bytes: '\\uD83C\\uDF4B' },
        { emoji: '🍌', unicode: 'U+1F34C', bytes: '\\uD83C\\uDF4C' },
        { emoji: '🍉', unicode: 'U+1F349', bytes: '\\uD83C\\uDF49' },
        { emoji: '🍇', unicode: 'U+1F347', bytes: '\\uD83C\\uDF47' },
        { emoji: '🍓', unicode: 'U+1F353', bytes: '\\uD83C\\uDF53' },
        { emoji: '🍈', unicode: 'U+1F348', bytes: '\\uD83C\\uDF48' },
        { emoji: '🍒', unicode: 'U+1F352', bytes: '\\uD83C\\uDF52' },
        { emoji: '🍑', unicode: 'U+1F351', bytes: '\\uD83C\\uDF51' },
        { emoji: '🥭', unicode: 'U+1F96D', bytes: '\\uD83E\\uDD6D' },
        { emoji: '🍍', unicode: 'U+1F34D', bytes: '\\uD83C\\uDF4D' },
        { emoji: '🥥', unicode: 'U+1F965', bytes: '\\uD83E\\uDD65' },
        { emoji: '🥝', unicode: 'U+1F95D', bytes: '\\uD83E\\uDD5D' },
        { emoji: '🍅', unicode: 'U+1F345', bytes: '\\uD83C\\uDF45' }
      ]
    },
    {
      category: '蔬菜',
      emojis: [
        { emoji: '🥬', unicode: 'U+1F96C', bytes: '\\uD83E\\uDD6C' },
        { emoji: '🥦', unicode: 'U+1F966', bytes: '\\uD83E\\uDD66' },
        { emoji: '🥒', unicode: 'U+1F952', bytes: '\\uD83E\\uDD52' },
        { emoji: '🌶️', unicode: 'U+1F336', bytes: '\\uD83C\\uDF36\\uFE0F' },
        { emoji: '🫑', unicode: 'U+1FAD1', bytes: '\\uD83E\\uDED1' },
        { emoji: '🥕', unicode: 'U+1F955', bytes: '\\uD83E\\uDD55' },
        { emoji: '🧄', unicode: 'U+1F9C4', bytes: '\\uD83E\\uDDC4' },
        { emoji: '🧅', unicode: 'U+1F9C5', bytes: '\\uD83E\\uDDC5' },
        { emoji: '🌽', unicode: 'U+1F33D', bytes: '\\uD83C\\uDF3D' },
        { emoji: '🥔', unicode: 'U+1F954', bytes: '\\uD83E\\uDD54' },
        { emoji: '🍠', unicode: 'U+1F360', bytes: '\\uD83C\\uDF60' },
        { emoji: '🥐', unicode: 'U+1F950', bytes: '\\uD83E\\uDD50' },
        { emoji: '🥯', unicode: 'U+1F96F', bytes: '\\uD83E\\uDD6F' },
        { emoji: '🍞', unicode: 'U+1F35E', bytes: '\\uD83C\\uDF5E' },
        { emoji: '🥖', unicode: 'U+1F956', bytes: '\\uD83E\\uDD56' },
        { emoji: '🧇', unicode: 'U+1F9C7', bytes: '\\uD83E\\uDDC7' }
      ]
    },
    {
      category: '心形',
      emojis: [
        { emoji: '❤️', unicode: 'U+2764', bytes: '\\u2764\\uFE0F' },
        { emoji: '🧡', unicode: 'U+1F9E1', bytes: '\\uD83E\\uDDE1' },
        { emoji: '💛', unicode: 'U+1F49B', bytes: '\\uD83D\\uDC9B' },
        { emoji: '💚', unicode: 'U+1F49A', bytes: '\\uD83D\\uDC9A' },
        { emoji: '💙', unicode: 'U+1F499', bytes: '\\uD83D\\uDC99' },
        { emoji: '💜', unicode: 'U+1F49C', bytes: '\\uD83D\\uDC9C' },
        { emoji: '🖤', unicode: 'U+1F5A4', bytes: '\\uD83D\\uDDA4' },
        { emoji: '🤍', unicode: 'U+1F90D', bytes: '\\uD83E\\uDD0D' },
        { emoji: '🤎', unicode: 'U+1F90E', bytes: '\\uD83E\\uDD0E' },
        { emoji: '💔', unicode: 'U+1F494', bytes: '\\uD83D\\uDC94' },
        { emoji: '❣️', unicode: 'U+2763', bytes: '\\u2763\\uFE0F' },
        { emoji: '💕', unicode: 'U+1F495', bytes: '\\uD83D\\uDC95' },
        { emoji: '💞', unicode: 'U+1F49E', bytes: '\\uD83D\\uDC9E' },
        { emoji: '💓', unicode: 'U+1F493', bytes: '\\uD83D\\uDC93' },
        { emoji: '💗', unicode: 'U+1F497', bytes: '\\uD83D\\uDC97' },
        { emoji: '💖', unicode: 'U+1F496', bytes: '\\uD83D\\uDC96' }
      ]
    },
    {
      category: '植物与花卉',
      emojis: [
        { emoji: '🌸', unicode: 'U+1F338', bytes: '\\uD83C\\uDF38' },
        { emoji: '💮', unicode: 'U+1F4AE', bytes: '\\uD83D\\uDCAE' },
        { emoji: '🏵️', unicode: 'U+1F3F5', bytes: '\\uD83C\\uDFF5\\uFE0F' },
        { emoji: '🌹', unicode: 'U+1F339', bytes: '\\uD83C\\uDF39' },
        { emoji: '🥀', unicode: 'U+1F940', bytes: '\\uD83E\\uDD40' },
        { emoji: '🌺', unicode: 'U+1F33A', bytes: '\\uD83C\\uDF3A' },
        { emoji: '🌻', unicode: 'U+1F33B', bytes: '\\uD83C\\uDF3B' },
        { emoji: '🌼', unicode: 'U+1F33C', bytes: '\\uD83C\\uDF3C' },
        { emoji: '🌷', unicode: 'U+1F337', bytes: '\\uD83C\\uDF37' },
        { emoji: '🌱', unicode: 'U+1F331', bytes: '\\uD83C\\uDF31' },
        { emoji: '🌲', unicode: 'U+1F332', bytes: '\\uD83C\\uDF32' },
        { emoji: '🌳', unicode: 'U+1F333', bytes: '\\uD83C\\uDF33' },
        { emoji: '☘️', unicode: 'U+2618', bytes: '\\u2618\\uFE0F' },
        { emoji: '🍀', unicode: 'U+1F340', bytes: '\\uD83C\\uDF40' },
        { emoji: '🌵', unicode: 'U+1F335', bytes: '\\uD83C\\uDF35' },
        { emoji: '🌴', unicode: 'U+1F334', bytes: '\\uD83C\\uDF34' }
      ]
    },
    {
      category: '天气',
      emojis: [
        { emoji: '☀️', unicode: 'U+2600', bytes: '\\u2600\\uFE0F' },
        { emoji: '🌤️', unicode: 'U+1F324', bytes: '\\uD83C\\uDF24\\uFE0F' },
        { emoji: '⛅', unicode: 'U+26C5', bytes: '\\u26C5' },
        { emoji: '🌥️', unicode: 'U+1F325', bytes: '\\uD83C\\uDF25\\uFE0F' },
        { emoji: '☁️', unicode: 'U+2601', bytes: '\\u2601\\uFE0F' },
        { emoji: '🌦️', unicode: 'U+1F326', bytes: '\\uD83C\\uDF26\\uFE0F' },
        { emoji: '🌧️', unicode: 'U+1F327', bytes: '\\uD83C\\uDF27\\uFE0F' },
        { emoji: '⛈️', unicode: 'U+26C8', bytes: '\\u26C8\\uFE0F' },
        { emoji: '🌩️', unicode: 'U+1F329', bytes: '\\uD83C\\uDF29\\uFE0F' },
        { emoji: '🌨️', unicode: 'U+1F328', bytes: '\\uD83C\\uDF28\\uFE0F' },
        { emoji: '❄️', unicode: 'U+2744', bytes: '\\u2744\\uFE0F' },
        { emoji: '☃️', unicode: 'U+2603', bytes: '\\u2603\\uFE0F' },
        { emoji: '⛄', unicode: 'U+26C4', bytes: '\\u26C4' },
        { emoji: '🌬️', unicode: 'U+1F32C', bytes: '\\uD83C\\uDF2C\\uFE0F' },
        { emoji: '💨', unicode: 'U+1F4A8', bytes: '\\uD83D\\uDCA8' },
        { emoji: '🌪️', unicode: 'U+1F32A', bytes: '\\uD83C\\uDF2A\\uFE0F' },
        { emoji: '🌈', unicode: 'U+1F308', bytes: '\\uD83C\\uDF08' },
        { emoji: '☔', unicode: 'U+2614', bytes: '\\u2614' },
        { emoji: '⚡', unicode: 'U+26A1', bytes: '\\u26A1' },
        { emoji: '❄️', unicode: 'U+2744', bytes: '\\u2744\\uFE0F' }
      ]
    },
    {
      category: '运动',
      emojis: [
        { emoji: '⚽', unicode: 'U+26BD', bytes: '\\u26BD' },
        { emoji: '🏀', unicode: 'U+1F3C0', bytes: '\\uD83C\\uDFC0' },
        { emoji: '🏈', unicode: 'U+1F3C8', bytes: '\\uD83C\\uDFC8' },
        { emoji: '⚾', unicode: 'U+26BE', bytes: '\\u26BE' },
        { emoji: '🎾', unicode: 'U+1F3BE', bytes: '\\uD83C\\uDFBE' },
        { emoji: '🏐', unicode: 'U+1F3D0', bytes: '\\uD83C\\uDFD0' },
        { emoji: '🏉', unicode: 'U+1F3C9', bytes: '\\uD83C\\uDFC9' },
        { emoji: '🥏', unicode: 'U+1F94F', bytes: '\\uD83E\\uDD4F' },
        { emoji: '🎱', unicode: 'U+1F3B1', bytes: '\\uD83C\\uDFB1' },
        { emoji: '🪀', unicode: 'U+1FA80', bytes: '\\uD83E\\uDE80' },
        { emoji: '🏓', unicode: 'U+1F3D3', bytes: '\\uD83C\\uDFD3' },
        { emoji: '🥊', unicode: 'U+1F94A', bytes: '\\uD83E\\uDD4A' },
        { emoji: '🥋', unicode: 'U+1F94B', bytes: '\\uD83E\\uDD4B' },
        { emoji: '⛳', unicode: 'U+26F3', bytes: '\\u26F3' },
        { emoji: '⛸️', unicode: 'U+26F8', bytes: '\\u26F8\\uFE0F' },
        { emoji: '🎣', unicode: 'U+1F3A3', bytes: '\\uD83C\\uDFA3' }
      ]
    },
    {
      category: '交通',
      emojis: [
        { emoji: '🚗', unicode: 'U+1F697', bytes: '\\uD83D\\uDE97' },
        { emoji: '🚕', unicode: 'U+1F695', bytes: '\\uD83D\\uDE95' },
        { emoji: '🚙', unicode: 'U+1F699', bytes: '\\uD83D\\uDE99' },
        { emoji: '🚌', unicode: 'U+1F68C', bytes: '\\uD83D\\uDE8C' },
        { emoji: '🚎', unicode: 'U+1F68E', bytes: '\\uD83D\\uDE8E' },
        { emoji: '🚓', unicode: 'U+1F693', bytes: '\\uD83D\\uDE93' },
        { emoji: '🚑', unicode: 'U+1F691', bytes: '\\uD83D\\uDE91' },
        { emoji: '🚒', unicode: 'U+1F692', bytes: '\\uD83D\\uDE92' },
        { emoji: '🚚', unicode: 'U+1F69A', bytes: '\\uD83D\\uDE9A' },
        { emoji: '🚛', unicode: 'U+1F69B', bytes: '\\uD83D\\uDE9B' },
        { emoji: '🚜', unicode: 'U+1F69C', bytes: '\\uD83D\\uDE9C' },
        { emoji: '🚲', unicode: 'U+1F6B2', bytes: '\\uD83D\\uDEB2' },
        { emoji: '🛵', unicode: 'U+1F6F5', bytes: '\\uD83D\\uDEF5' },
        { emoji: '🏍️', unicode: 'U+1F3CD', bytes: '\\uD83C\\uDFCD\\uFE0F' },
        { emoji: '🚂', unicode: 'U+1F682', bytes: '\\uD83D\\uDE82' },
        { emoji: '✈️', unicode: 'U+2708', bytes: '\\u2708\\uFE0F' }
      ]
    },
  ];
});

// 复制到剪贴板功能
const copyToClipboard = (emoji: { emoji: string; unicode: string; bytes: string }, groupIndex: number, emojiIndex: number) => {
  let copyContent = '';
  
  if (copyMode.value === 'emoji') {
    copyContent = emoji.emoji;
  } else if (copyMode.value === 'unicode') {
    copyContent = emoji.unicode;
  } else {
    copyContent = emoji.bytes;
  }
  
  navigator.clipboard.writeText(copyContent)
    .then(() => {
      // 设置当前复制状态
      currentCopiedIndex.value = { groupIndex, emojiIndex };
      
      // 2秒后重置状态
      setTimeout(() => {
        if (currentCopiedIndex.value?.groupIndex === groupIndex && 
            currentCopiedIndex.value?.emojiIndex === emojiIndex) {
          currentCopiedIndex.value = null;
        }
      }, 2000);
    })
    .catch(() => {
      console.error('复制失败');
    });
};

// 获取表情的tooltip文本
const getTooltipContent = (emoji: { emoji: string; unicode: string; bytes: string }, groupIndex: number, emojiIndex: number) => {
  // 如果是当前复制的表情，显示复制成功提示
  if (currentCopiedIndex.value?.groupIndex === groupIndex && 
      currentCopiedIndex.value?.emojiIndex === emojiIndex) {
    return '复制成功！';
  }
  
  // 否则显示将要复制的内容
  if (copyMode.value === 'emoji') {
    return `点击复制: ${emoji.emoji}`;
  } else if (copyMode.value === 'unicode') {
    return `点击复制: ${emoji.unicode}`;
  } else {
    return `点击复制: ${emoji.bytes}`;
  }
};
</script>

<template>
  <div class="emoji-container">
    <h1>Unicode Emoji 表情符号</h1>
    
    <div class="mode-selector">
      <el-radio-group v-model="copyMode" size="large">
        <el-radio label="emoji">复制表情符号</el-radio>
        <el-radio label="unicode">复制Unicode码</el-radio>
        <el-radio label="bytes">复制字节码</el-radio>
      </el-radio-group>
    </div>
    
    <div class="tip">
      <p v-if="copyMode === 'emoji'">点击表情符号可直接复制该表情</p>
      <p v-else-if="copyMode === 'unicode'">点击表情符号可复制其Unicode表示</p>
      <p v-else>点击表情符号可复制其字节码表示</p>
    </div>
    
    <!-- 修复模板中的类型不匹配问题 -->
    <div v-for="(group, groupIndex) in emojiGroups" :key="groupIndex" class="emoji-group">
      <h2 class="category-title">{{ group.category }}</h2>
      <div class="emoji-grid">
        <el-tooltip
          v-for="(emoji, emojiIndex) in group.emojis"
          :key="emojiIndex"
          :content="getTooltipContent(emoji, groupIndex, emojiIndex)"
          placement="top"
          :effect="currentCopiedIndex?.groupIndex === groupIndex && currentCopiedIndex?.emojiIndex === emojiIndex ? 'light' : 'dark'"
          :enterable="false"
        >
          <div 
            class="emoji-item"
            @click="copyToClipboard(emoji, groupIndex, emojiIndex)"
          >
            {{ emoji.emoji }}
          </div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.emoji-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  
  h1 {
    margin-bottom: 24px;
    font-size: 28px;
  }
}

.mode-selector {
  margin: 20px 0;
}

.tip {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.emoji-group {
  margin-bottom: 30px;
  
  .category-title {
    font-size: 22px;
    margin-bottom: 15px;
    text-align: left;
    padding-left: 10px;
    border-left: 4px solid #409EFF;
  }
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
}

.emoji-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  font-size: 28px;
  border-radius: 8px;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

@media (max-width: 768px) {
  .emoji-item {
    width: 45px;
    height: 45px;
    font-size: 26px;
  }
}

@media (max-width: 480px) {
  .emoji-item {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
}

// 自定义消息提示样式
:deep(.custom-message) {
  min-width: 100px !important;
  padding: 8px 12px !important;
  margin-top: 10px !important;
  z-index: 9999;
  
  // 移除巨大对号
  .el-icon {
    display: none !important;
  }
  
  // 调整文字位置和大小
  .el-message__content {
    padding-left: 0 !important;
    font-size: 14px !important;
  }
}

// 成功状态的tooltip样式
:deep(.el-tooltip__popper.is-light) {
  background: #f0f9eb;
  color: #67c23a;
  border-color: #67c23a;
}
</style>
