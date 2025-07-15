<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import CardView from "@/components/CardView.vue";

// 复制模式：emoji-直接复制表情，unicode-复制Unicode，bytes-复制字节码
const copyMode = ref("emoji");

// 追踪当前复制状态的emoji索引
const currentCopiedIndex = ref<{
  groupIndex: number;
  emojiIndex: number;
} | null>(null);

// 修复类型定义：将类型改为数组
const emojiGroups = ref<
  {
    category: string;
    emojis: Array<{ emoji: string; unicode: string; bytes: string }>;
  }[]
>([]);

// 检测当前主题
const isDarkMode = computed(() => {
  return document.documentElement.getAttribute("data-theme") === "dark";
});

// 切换明暗主题
const toggleTheme = () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
};

// 加载 emoji 数据
onMounted(() => {
  // 全面收录Unicode表情符号
  emojiGroups.value = [
    {
      category: "笑脸和表情",
      emojis: [
        { emoji: "😀", unicode: "U+1F600", bytes: "\\uD83D\\uDE00" },
        { emoji: "😁", unicode: "U+1F601", bytes: "\\uD83D\\uDE01" },
        { emoji: "😂", unicode: "U+1F602", bytes: "\\uD83D\\uDE02" },
        { emoji: "🤣", unicode: "U+1F923", bytes: "\\uD83E\\uDD23" },
        { emoji: "😃", unicode: "U+1F603", bytes: "\\uD83D\\uDE03" },
        { emoji: "😄", unicode: "U+1F604", bytes: "\\uD83D\\uDE04" },
        { emoji: "😅", unicode: "U+1F605", bytes: "\\uD83D\\uDE05" },
        { emoji: "😆", unicode: "U+1F606", bytes: "\\uD83D\\uDE06" },
        { emoji: "😉", unicode: "U+1F609", bytes: "\\uD83D\\uDE09" },
        { emoji: "😊", unicode: "U+1F60A", bytes: "\\uD83D\\uDE0A" },
        { emoji: "😋", unicode: "U+1F60B", bytes: "\\uD83D\\uDE0B" },
        { emoji: "😎", unicode: "U+1F60E", bytes: "\\uD83D\\uDE0E" },
        { emoji: "😍", unicode: "U+1F60D", bytes: "\\uD83D\\uDE0D" },
        { emoji: "😘", unicode: "U+1F618", bytes: "\\uD83D\\uDE18" },
        { emoji: "🥰", unicode: "U+1F970", bytes: "\\uD83E\\uDD70" },
        { emoji: "😗", unicode: "U+1F617", bytes: "\\uD83D\\uDE17" },
        { emoji: "😙", unicode: "U+1F619", bytes: "\\uD83D\\uDE19" },
        { emoji: "😚", unicode: "U+1F61A", bytes: "\\uD83D\\uDE1A" },
        { emoji: "🙂", unicode: "U+1F642", bytes: "\\uD83D\\uDE42" },
        { emoji: "🤗", unicode: "U+1F917", bytes: "\\uD83E\\uDD17" },
        { emoji: "🤩", unicode: "U+1F929", bytes: "\\uD83E\\uDD29" },
        { emoji: "🤔", unicode: "U+1F914", bytes: "\\uD83E\\uDD14" },
        { emoji: "🤨", unicode: "U+1F928", bytes: "\\uD83E\\uDD28" },
        { emoji: "😐", unicode: "U+1F610", bytes: "\\uD83D\\uDE10" },
        {
          emoji: "😶‍🌫️",
          unicode: "U+1F636 U+200D U+1F32B U+FE0F",
          bytes: "\\uD83D\\uDE36\\u200D\\uD83C\\uDF2B\\uFE0F",
        },
        { emoji: "🫥", unicode: "U+1FAE5", bytes: "\\uD83E\\uDEE5" },
        { emoji: "😬", unicode: "U+1F62C", bytes: "\\uD83D\\uDE2C" },
        { emoji: "🫠", unicode: "U+1FAE0", bytes: "\\uD83E\\uDEE0" },
        { emoji: "🙃", unicode: "U+1F643", bytes: "\\uD83D\\uDE43" },
        { emoji: "😏", unicode: "U+1F60F", bytes: "\\uD83D\\uDE0F" },
        { emoji: "😯", unicode: "U+1F62F", bytes: "\\uD83D\\uDE2F" },
        { emoji: "😦", unicode: "U+1F626", bytes: "\\uD83D\\uDE26" },
        { emoji: "😧", unicode: "U+1F627", bytes: "\\uD83D\\uDE27" },
        { emoji: "😮", unicode: "U+1F62E", bytes: "\\uD83D\\uDE2E" },
        { emoji: "😲", unicode: "U+1F632", bytes: "\\uD83D\\uDE32" },
        { emoji: "🥱", unicode: "U+1F971", bytes: "\\uD83E\\uDD71" },
        { emoji: "😴", unicode: "U+1F634", bytes: "\\uD83D\\uDE34" },
        { emoji: "🤤", unicode: "U+1F924", bytes: "\\uD83E\\uDD24" },
        { emoji: "😪", unicode: "U+1F62A", bytes: "\\uD83D\\uDE2A" },
        {
          emoji: "😵‍💫",
          unicode: "U+1F635 U+200D U+1F4AB",
          bytes: "\\uD83D\\uDE35\\u200D\\uD83D\\uDCAB",
        },
        { emoji: "🫨", unicode: "U+1FAE8", bytes: "\\uD83E\\uDEE8" },
        { emoji: "🤐", unicode: "U+1F910", bytes: "\\uD83E\\uDD10" },
        { emoji: "🥴", unicode: "U+1F974", bytes: "\\uD83E\\uDD74" },
        { emoji: "🤢", unicode: "U+1F922", bytes: "\\uD83E\\uDD22" },
        { emoji: "🤮", unicode: "U+1F92E", bytes: "\\uD83E\\uDD2E" },
        { emoji: "🤧", unicode: "U+1F927", bytes: "\\uD83E\\uDD27" },
        { emoji: "😷", unicode: "U+1F637", bytes: "\\uD83D\\uDE37" },
        { emoji: "🤒", unicode: "U+1F912", bytes: "\\uD83E\\uDD12" },
        { emoji: "🤕", unicode: "U+1F915", bytes: "\\uD83E\\uDD15" },
      ],
    },
    {
      category: "负面情绪",
      emojis: [
        { emoji: "😑", unicode: "U+1F611", bytes: "\\uD83D\\uDE11" },
        { emoji: "😶", unicode: "U+1F636", bytes: "\\uD83D\\uDE36" },
        { emoji: "😏", unicode: "U+1F60F", bytes: "\\uD83D\\uDE0F" },
        { emoji: "😒", unicode: "U+1F612", bytes: "\\uD83D\\uDE12" },
        { emoji: "🙄", unicode: "U+1F644", bytes: "\\uD83D\\uDE44" },
        { emoji: "😬", unicode: "U+1F62C", bytes: "\\uD83D\\uDE2C" },
        { emoji: "🤥", unicode: "U+1F925", bytes: "\\uD83E\\uDD25" },
        { emoji: "😌", unicode: "U+1F60C", bytes: "\\uD83D\\uDE0C" },
        { emoji: "😔", unicode: "U+1F614", bytes: "\\uD83D\\uDE14" },
        { emoji: "😪", unicode: "U+1F62A", bytes: "\\uD83D\\uDE2A" },
        { emoji: "🤤", unicode: "U+1F924", bytes: "\\uD83E\\uDD24" },
        { emoji: "😴", unicode: "U+1F634", bytes: "\\uD83D\\uDE34" },
        { emoji: "😷", unicode: "U+1F637", bytes: "\\uD83D\\uDE37" },
        { emoji: "🤒", unicode: "U+1F912", bytes: "\\uD83E\\uDD12" },
        { emoji: "🤕", unicode: "U+1F915", bytes: "\\uD83E\\uDD15" },
        { emoji: "🤢", unicode: "U+1F922", bytes: "\\uD83E\\uDD22" },
        { emoji: "🤮", unicode: "U+1F92E", bytes: "\\uD83E\\uDD2E" },
        { emoji: "🤧", unicode: "U+1F927", bytes: "\\uD83E\\uDD27" },
        { emoji: "🥵", unicode: "U+1F975", bytes: "\\uD83E\\uDD75" },
        { emoji: "🥶", unicode: "U+1F976", bytes: "\\uD83E\\uDD76" },
        { emoji: "🥴", unicode: "U+1F974", bytes: "\\uD83E\\uDD74" },
        { emoji: "😵", unicode: "U+1F635", bytes: "\\uD83D\\uDE35" },
        { emoji: "🤯", unicode: "U+1F92F", bytes: "\\uD83E\\uDD2F" },
        { emoji: "😕", unicode: "U+1F615", bytes: "\\uD83D\\uDE15" },
        { emoji: "😟", unicode: "U+1F61F", bytes: "\\uD83D\\uDE1F" },
        { emoji: "🙁", unicode: "U+1F641", bytes: "\\uD83D\\uDE41" },
        { emoji: "☹️", unicode: "U+2639", bytes: "\\u2639\\uFE0F" },
        { emoji: "😮", unicode: "U+1F62E", bytes: "\\uD83D\\uDE2E" },
        { emoji: "😯", unicode: "U+1F62F", bytes: "\\uD83D\\uDE2F" },
        { emoji: "😲", unicode: "U+1F632", bytes: "\\uD83D\\uDE32" },
        { emoji: "😳", unicode: "U+1F633", bytes: "\\uD83D\\uDE33" },
        { emoji: "🥺", unicode: "U+1F97A", bytes: "\\uD83E\\uDD7A" },
        { emoji: "😦", unicode: "U+1F626", bytes: "\\uD83D\\uDE26" },
        { emoji: "😧", unicode: "U+1F627", bytes: "\\uD83D\\uDE27" },
        { emoji: "😨", unicode: "U+1F628", bytes: "\\uD83D\\uDE28" },
        { emoji: "😰", unicode: "U+1F630", bytes: "\\uD83D\\uDE30" },
        { emoji: "😥", unicode: "U+1F625", bytes: "\\uD83D\\uDE25" },
        { emoji: "😢", unicode: "U+1F622", bytes: "\\uD83D\\uDE22" },
        { emoji: "😭", unicode: "U+1F62D", bytes: "\\uD83D\\uDE2D" },
        { emoji: "😱", unicode: "U+1F631", bytes: "\\uD83D\\uDE31" },
        { emoji: "😖", unicode: "U+1F616", bytes: "\\uD83D\\uDE16" },
        { emoji: "😣", unicode: "U+1F623", bytes: "\\uD83D\\uDE23" },
        { emoji: "😞", unicode: "U+1F61E", bytes: "\\uD83D\\uDE1E" },
        { emoji: "😓", unicode: "U+1F613", bytes: "\\uD83D\\uDE13" },
        { emoji: "😩", unicode: "U+1F629", bytes: "\\uD83D\\uDE29" },
        { emoji: "😫", unicode: "U+1F62B", bytes: "\\uD83D\\uDE2B" },
        { emoji: "🥱", unicode: "U+1F971", bytes: "\\uD83E\\uDD71" },
        { emoji: "😤", unicode: "U+1F624", bytes: "\\uD83D\\uDE24" },
        { emoji: "😡", unicode: "U+1F621", bytes: "\\uD83D\\uDE21" },
        { emoji: "😠", unicode: "U+1F620", bytes: "\\uD83D\\uDE20" },
        { emoji: "🤬", unicode: "U+1F92C", bytes: "\\uD83E\\uDD2C" },
      ],
    },
    {
      category: "面具和符号脸",
      emojis: [
        { emoji: "😈", unicode: "U+1F608", bytes: "\\uD83D\\uDE08" },
        { emoji: "👿", unicode: "U+1F47F", bytes: "\\uD83D\\uDC7F" },
        { emoji: "💀", unicode: "U+1F480", bytes: "\\uD83D\\uDC80" },
        { emoji: "☠️", unicode: "U+2620", bytes: "\\u2620\\uFE0F" },
        { emoji: "💩", unicode: "U+1F4A9", bytes: "\\uD83D\\uDCA9" },
        { emoji: "🤡", unicode: "U+1F921", bytes: "\\uD83E\\uDD21" },
        { emoji: "👹", unicode: "U+1F479", bytes: "\\uD83D\\uDC79" },
        { emoji: "👺", unicode: "U+1F47A", bytes: "\\uD83D\\uDC7A" },
        { emoji: "👻", unicode: "U+1F47B", bytes: "\\uD83D\\uDC7B" },
        { emoji: "👽", unicode: "U+1F47D", bytes: "\\uD83D\\uDC7D" },
        { emoji: "👾", unicode: "U+1F47E", bytes: "\\uD83D\\uDC7E" },
        { emoji: "🤖", unicode: "U+1F916", bytes: "\\uD83E\\uDD16" },
        { emoji: "😺", unicode: "U+1F63A", bytes: "\\uD83D\\uDE3A" },
        { emoji: "😸", unicode: "U+1F638", bytes: "\\uD83D\\uDE38" },
        { emoji: "😹", unicode: "U+1F639", bytes: "\\uD83D\\uDE39" },
        { emoji: "😻", unicode: "U+1F63B", bytes: "\\uD83D\\uDE3B" },
        { emoji: "😼", unicode: "U+1F63C", bytes: "\\uD83D\\uDE3C" },
        { emoji: "😽", unicode: "U+1F63D", bytes: "\\uD83D\\uDE3D" },
        { emoji: "🙀", unicode: "U+1F640", bytes: "\\uD83D\\uDE40" },
        { emoji: "😿", unicode: "U+1F63F", bytes: "\\uD83D\\uDE3F" },
        { emoji: "😾", unicode: "U+1F63E", bytes: "\\uD83D\\uDE3E" },
      ],
    },
    {
      category: "手势",
      emojis: [
        { emoji: "�", unicode: "U+1F44B", bytes: "\\uD83D\\uDC4B" },
        { emoji: "🤚", unicode: "U+1F91A", bytes: "\\uD83E\\uDD1A" },
        { emoji: "�️", unicode: "U+1F590", bytes: "\\uD83D\\uDD90\\uFE0F" },
        { emoji: "✋", unicode: "U+270B", bytes: "\\u270B" },
        { emoji: "🖖", unicode: "U+1F596", bytes: "\\uD83D\\uDD96" },
        { emoji: "👌", unicode: "U+1F44C", bytes: "\\uD83D\\uDC4C" },
        { emoji: "🤌", unicode: "U+1F90C", bytes: "\\uD83E\\uDD0C" },
        { emoji: "🤏", unicode: "U+1F90F", bytes: "\\uD83E\\uDD0F" },
        { emoji: "✌️", unicode: "U+270C", bytes: "\\u270C\\uFE0F" },
        { emoji: "🤞", unicode: "U+1F91E", bytes: "\\uD83E\\uDD1E" },
        { emoji: "🤟", unicode: "U+1F91F", bytes: "\\uD83E\\uDD1F" },
        { emoji: "🤘", unicode: "U+1F918", bytes: "\\uD83E\\uDD18" },
        { emoji: "🤙", unicode: "U+1F919", bytes: "\\uD83E\\uDD19" },
        { emoji: "👈", unicode: "U+1F448", bytes: "\\uD83D\\uDC48" },
        { emoji: "👉", unicode: "U+1F449", bytes: "\\uD83D\\uDC49" },
        { emoji: "👆", unicode: "U+1F446", bytes: "\\uD83D\\uDC46" },
        { emoji: "🖕", unicode: "U+1F595", bytes: "\\uD83D\\uDD95" },
        { emoji: "👇", unicode: "U+1F447", bytes: "\\uD83D\\uDC47" },
        { emoji: "☝️", unicode: "U+261D", bytes: "\\u261D\\uFE0F" },
        { emoji: "👍", unicode: "U+1F44D", bytes: "\\uD83D\\uDC4D" },
        { emoji: "�", unicode: "U+1F44E", bytes: "\\uD83D\\uDC4E" },
        { emoji: "✊", unicode: "U+270A", bytes: "\\u270A" },
        { emoji: "👊", unicode: "U+1F44A", bytes: "\\uD83D\\uDC4A" },
        { emoji: "🤛", unicode: "U+1F91B", bytes: "\\uD83E\\uDD1B" },
        { emoji: "🤜", unicode: "U+1F91C", bytes: "\\uD83E\\uDD1C" },
        { emoji: "👏", unicode: "U+1F44F", bytes: "\\uD83D\\uDC4F" },
        { emoji: "�", unicode: "U+1F64C", bytes: "\\uD83D\\uDE4C" },
        { emoji: "👐", unicode: "U+1F450", bytes: "\\uD83D\\uDC50" },
        { emoji: "�", unicode: "U+1F932", bytes: "\\uD83E\\uDD32" },
        { emoji: "🤝", unicode: "U+1F91D", bytes: "\\uD83E\\uDD1D" },
        { emoji: "�", unicode: "U+1F64F", bytes: "\\uD83D\\uDE4F" },
        { emoji: "✍️", unicode: "U+270D", bytes: "\\u270D\\uFE0F" },
        { emoji: "💅", unicode: "U+1F485", bytes: "\\uD83D\\uDC85" },
        { emoji: "🤳", unicode: "U+1F933", bytes: "\\uD83E\\uDD33" },
        { emoji: "�💪", unicode: "U+1F4AA", bytes: "\\uD83D\\uDCAA" },
        { emoji: "�", unicode: "U+1F9BE", bytes: "\\uD83E\\uDDBE" },
        { emoji: "🦿", unicode: "U+1F9BF", bytes: "\\uD83E\\uDDBF" },
        { emoji: "🦵", unicode: "U+1F9B5", bytes: "\\uD83E\\uDDB5" },
        { emoji: "🦶", unicode: "U+1F9B6", bytes: "\\uD83E\\uDDB6" },
        { emoji: "�", unicode: "U+1F442", bytes: "\\uD83D\\uDC42" },
        { emoji: "🦻", unicode: "U+1F9BB", bytes: "\\uD83E\\uDDBB" },
        { emoji: "�", unicode: "U+1F443", bytes: "\\uD83D\\uDC43" },
        { emoji: "🧠", unicode: "U+1F9E0", bytes: "\\uD83E\\uDDE0" },
        { emoji: "🫀", unicode: "U+1FAC0", bytes: "\\uD83E\\uDEC0" },
        { emoji: "🫁", unicode: "U+1FAC1", bytes: "\\uD83E\\uDEC1" },
        { emoji: "�", unicode: "U+1F9B7", bytes: "\\uD83E\\uDDB7" },
        { emoji: "🦴", unicode: "U+1F9B4", bytes: "\\uD83E\\uDDB4" },
        { emoji: "👀", unicode: "U+1F440", bytes: "\\uD83D\\uDC40" },
        { emoji: "�️", unicode: "U+1F441", bytes: "\\uD83D\\uDC41\\uFE0F" },
        { emoji: "�", unicode: "U+1F445", bytes: "\\uD83D\\uDC45" },
        { emoji: "👄", unicode: "U+1F444", bytes: "\\uD83D\\uDC44" },
      ],
    },
    {
      category: "动物",
      emojis: [
        { emoji: "🐶", unicode: "U+1F436", bytes: "\\uD83D\\uDC36" },
        { emoji: "🐱", unicode: "U+1F431", bytes: "\\uD83D\\uDC31" },
        { emoji: "🐭", unicode: "U+1F42D", bytes: "\\uD83D\\uDC2D" },
        { emoji: "🐹", unicode: "U+1F439", bytes: "\\uD83D\\uDC39" },
        { emoji: "🐰", unicode: "U+1F430", bytes: "\\uD83D\\uDC30" },
        { emoji: "🦊", unicode: "U+1F98A", bytes: "\\uD83E\\uDD8A" },
        { emoji: "🐻", unicode: "U+1F43B", bytes: "\\uD83D\\uDC3B" },
        { emoji: "🐼", unicode: "U+1F43C", bytes: "\\uD83D\\uDC3C" },
        { emoji: "🐨", unicode: "U+1F428", bytes: "\\uD83D\\uDC28" },
        { emoji: "🐯", unicode: "U+1F42F", bytes: "\\uD83D\\uDC2F" },
        { emoji: "🦁", unicode: "U+1F981", bytes: "\\uD83E\\uDD81" },
        { emoji: "🐮", unicode: "U+1F42E", bytes: "\\uD83D\\uDC2E" },
        { emoji: "🐷", unicode: "U+1F437", bytes: "\\uD83D\\uDC37" },
        { emoji: "🐸", unicode: "U+1F438", bytes: "\\uD83D\\uDC38" },
        { emoji: "🐵", unicode: "U+1F435", bytes: "\\uD83D\\uDC35" },
        { emoji: "🐔", unicode: "U+1F414", bytes: "\\uD83D\\uDC14" },
        { emoji: "🐧", unicode: "U+1F427", bytes: "\\uD83D\\uDC27" },
        { emoji: "🐦", unicode: "U+1F426", bytes: "\\uD83D\\uDC26" },
        { emoji: "🦆", unicode: "U+1F986", bytes: "\\uD83E\\uDD86" },
        { emoji: "🦅", unicode: "U+1F985", bytes: "\\uD83E\\uDD85" },
        { emoji: "🦉", unicode: "U+1F989", bytes: "\\uD83E\\uDD89" },
        { emoji: "🦇", unicode: "U+1F987", bytes: "\\uD83E\\uDD87" },
        { emoji: "🐺", unicode: "U+1F43A", bytes: "\\uD83D\\uDC3A" },
        { emoji: "🐗", unicode: "U+1F417", bytes: "\\uD83D\\uDC17" },
      ],
    },
    {
      category: "海洋动物",
      emojis: [
        { emoji: "🐳", unicode: "U+1F433", bytes: "\\uD83D\\uDC33" },
        { emoji: "🐋", unicode: "U+1F40B", bytes: "\\uD83D\\uDC0B" },
        { emoji: "🐬", unicode: "U+1F42C", bytes: "\\uD83D\\uDC2C" },
        { emoji: "🦭", unicode: "U+1F9AD", bytes: "\\uD83E\\uDDAD" },
        { emoji: "🐟", unicode: "U+1F41F", bytes: "\\uD83D\\uDC1F" },
        { emoji: "🐠", unicode: "U+1F420", bytes: "\\uD83D\\uDC20" },
        { emoji: "🐡", unicode: "U+1F421", bytes: "\\uD83D\\uDC21" },
        { emoji: "🦈", unicode: "U+1F988", bytes: "\\uD83E\\uDD88" },
        { emoji: "🐙", unicode: "U+1F419", bytes: "\\uD83D\\uDC19" },
        { emoji: "🐚", unicode: "U+1F41A", bytes: "\\uD83D\\uDC1A" },
        { emoji: "🪸", unicode: "U+1FAB8", bytes: "\\uD83E\\uDEB8" },
        { emoji: "🦀", unicode: "U+1F980", bytes: "\\uD83E\\uDD80" },
        { emoji: "🦞", unicode: "U+1F99E", bytes: "\\uD83E\\uDD9E" },
        { emoji: "🦐", unicode: "U+1F990", bytes: "\\uD83E\\uDD90" },
        { emoji: "🦑", unicode: "U+1F991", bytes: "\\uD83E\\uDD91" },
        { emoji: "🦧", unicode: "U+1F9A7", bytes: "\\uD83E\\uDDA7" },
      ],
    },
    {
      category: "水果",
      emojis: [
        { emoji: "🍎", unicode: "U+1F34E", bytes: "\\uD83C\\uDF4E" },
        { emoji: "🍐", unicode: "U+1F350", bytes: "\\uD83C\\uDF50" },
        { emoji: "🍊", unicode: "U+1F34A", bytes: "\\uD83C\\uDF4A" },
        { emoji: "🍋", unicode: "U+1F34B", bytes: "\\uD83C\\uDF4B" },
        { emoji: "🍌", unicode: "U+1F34C", bytes: "\\uD83C\\uDF4C" },
        { emoji: "🍉", unicode: "U+1F349", bytes: "\\uD83C\\uDF49" },
        { emoji: "🍇", unicode: "U+1F347", bytes: "\\uD83C\\uDF47" },
        { emoji: "🍓", unicode: "U+1F353", bytes: "\\uD83C\\uDF53" },
        { emoji: "🍈", unicode: "U+1F348", bytes: "\\uD83C\\uDF48" },
        { emoji: "🍒", unicode: "U+1F352", bytes: "\\uD83C\\uDF52" },
        { emoji: "🍑", unicode: "U+1F351", bytes: "\\uD83C\\uDF51" },
        { emoji: "🥭", unicode: "U+1F96D", bytes: "\\uD83E\\uDD6D" },
        { emoji: "🍍", unicode: "U+1F34D", bytes: "\\uD83C\\uDF4D" },
        { emoji: "🥥", unicode: "U+1F965", bytes: "\\uD83E\\uDD65" },
        { emoji: "🥝", unicode: "U+1F95D", bytes: "\\uD83E\\uDD5D" },
        { emoji: "🍅", unicode: "U+1F345", bytes: "\\uD83C\\uDF45" },
      ],
    },
    {
      category: "蔬菜",
      emojis: [
        { emoji: "🥬", unicode: "U+1F96C", bytes: "\\uD83E\\uDD6C" },
        { emoji: "🥦", unicode: "U+1F966", bytes: "\\uD83E\\uDD66" },
        { emoji: "🥒", unicode: "U+1F952", bytes: "\\uD83E\\uDD52" },
        { emoji: "🌶️", unicode: "U+1F336", bytes: "\\uD83C\\uDF36\\uFE0F" },
        { emoji: "🫑", unicode: "U+1FAD1", bytes: "\\uD83E\\uDED1" },
        { emoji: "🥕", unicode: "U+1F955", bytes: "\\uD83E\\uDD55" },
        { emoji: "🧄", unicode: "U+1F9C4", bytes: "\\uD83E\\uDDC4" },
        { emoji: "🧅", unicode: "U+1F9C5", bytes: "\\uD83E\\uDDC5" },
        { emoji: "🌽", unicode: "U+1F33D", bytes: "\\uD83C\\uDF3D" },
        { emoji: "🥔", unicode: "U+1F954", bytes: "\\uD83E\\uDD54" },
        { emoji: "🍠", unicode: "U+1F360", bytes: "\\uD83C\\uDF60" },
        { emoji: "🥐", unicode: "U+1F950", bytes: "\\uD83E\\uDD50" },
        { emoji: "🥯", unicode: "U+1F96F", bytes: "\\uD83E\\uDD6F" },
        { emoji: "🍞", unicode: "U+1F35E", bytes: "\\uD83C\\uDF5E" },
        { emoji: "🥖", unicode: "U+1F956", bytes: "\\uD83E\\uDD56" },
        { emoji: "🧇", unicode: "U+1F9C7", bytes: "\\uD83E\\uDDC7" },
      ],
    },
    {
      category: "心形",
      emojis: [
        { emoji: "❤️", unicode: "U+2764", bytes: "\\u2764\\uFE0F" },
        { emoji: "🧡", unicode: "U+1F9E1", bytes: "\\uD83E\\uDDE1" },
        { emoji: "💛", unicode: "U+1F49B", bytes: "\\uD83D\\uDC9B" },
        { emoji: "💚", unicode: "U+1F49A", bytes: "\\uD83D\\uDC9A" },
        { emoji: "💙", unicode: "U+1F499", bytes: "\\uD83D\\uDC99" },
        { emoji: "💜", unicode: "U+1F49C", bytes: "\\uD83D\\uDC9C" },
        { emoji: "🖤", unicode: "U+1F5A4", bytes: "\\uD83D\\uDDA4" },
        { emoji: "🤍", unicode: "U+1F90D", bytes: "\\uD83E\\uDD0D" },
        { emoji: "🤎", unicode: "U+1F90E", bytes: "\\uD83E\\uDD0E" },
        { emoji: "💔", unicode: "U+1F494", bytes: "\\uD83D\\uDC94" },
        { emoji: "❣️", unicode: "U+2763", bytes: "\\u2763\\uFE0F" },
        { emoji: "💕", unicode: "U+1F495", bytes: "\\uD83D\\uDC95" },
        { emoji: "💞", unicode: "U+1F49E", bytes: "\\uD83D\\uDC9E" },
        { emoji: "💓", unicode: "U+1F493", bytes: "\\uD83D\\uDC93" },
        { emoji: "💗", unicode: "U+1F497", bytes: "\\uD83D\\uDC97" },
        { emoji: "💖", unicode: "U+1F496", bytes: "\\uD83D\\uDC96" },
      ],
    },
    {
      category: "植物与花卉",
      emojis: [
        { emoji: "🌸", unicode: "U+1F338", bytes: "\\uD83C\\uDF38" },
        { emoji: "💮", unicode: "U+1F4AE", bytes: "\\uD83D\\uDCAE" },
        { emoji: "🏵️", unicode: "U+1F3F5", bytes: "\\uD83C\\uDFF5\\uFE0F" },
        { emoji: "🌹", unicode: "U+1F339", bytes: "\\uD83C\\uDF39" },
        { emoji: "🥀", unicode: "U+1F940", bytes: "\\uD83E\\uDD40" },
        { emoji: "🌺", unicode: "U+1F33A", bytes: "\\uD83C\\uDF3A" },
        { emoji: "🌻", unicode: "U+1F33B", bytes: "\\uD83C\\uDF3B" },
        { emoji: "🌼", unicode: "U+1F33C", bytes: "\\uD83C\\uDF3C" },
        { emoji: "🌷", unicode: "U+1F337", bytes: "\\uD83C\\uDF37" },
        { emoji: "🌱", unicode: "U+1F331", bytes: "\\uD83C\\uDF31" },
        { emoji: "🌲", unicode: "U+1F332", bytes: "\\uD83C\\uDF32" },
        { emoji: "🌳", unicode: "U+1F333", bytes: "\\uD83C\\uDF33" },
        { emoji: "☘️", unicode: "U+2618", bytes: "\\u2618\\uFE0F" },
        { emoji: "🍀", unicode: "U+1F340", bytes: "\\uD83C\\uDF40" },
        { emoji: "🌵", unicode: "U+1F335", bytes: "\\uD83C\\uDF35" },
        { emoji: "🌴", unicode: "U+1F334", bytes: "\\uD83C\\uDF34" },
      ],
    },
    {
      category: "天气",
      emojis: [
        { emoji: "☀️", unicode: "U+2600", bytes: "\\u2600\\uFE0F" },
        { emoji: "🌤️", unicode: "U+1F324", bytes: "\\uD83C\\uDF24\\uFE0F" },
        { emoji: "⛅", unicode: "U+26C5", bytes: "\\u26C5" },
        { emoji: "🌥️", unicode: "U+1F325", bytes: "\\uD83C\\uDF25\\uFE0F" },
        { emoji: "☁️", unicode: "U+2601", bytes: "\\u2601\\uFE0F" },
        { emoji: "🌦️", unicode: "U+1F326", bytes: "\\uD83C\\uDF26\\uFE0F" },
        { emoji: "🌧️", unicode: "U+1F327", bytes: "\\uD83C\\uDF27\\uFE0F" },
        { emoji: "⛈️", unicode: "U+26C8", bytes: "\\u26C8\\uFE0F" },
        { emoji: "🌩️", unicode: "U+1F329", bytes: "\\uD83C\\uDF29\\uFE0F" },
        { emoji: "🌨️", unicode: "U+1F328", bytes: "\\uD83C\\uDF28\\uFE0F" },
        { emoji: "❄️", unicode: "U+2744", bytes: "\\u2744\\uFE0F" },
        { emoji: "☃️", unicode: "U+2603", bytes: "\\u2603\\uFE0F" },
        { emoji: "⛄", unicode: "U+26C4", bytes: "\\u26C4" },
        { emoji: "🌬️", unicode: "U+1F32C", bytes: "\\uD83C\\uDF2C\\uFE0F" },
        { emoji: "💨", unicode: "U+1F4A8", bytes: "\\uD83D\\uDCA8" },
        { emoji: "🌪️", unicode: "U+1F32A", bytes: "\\uD83C\\uDF2A\\uFE0F" },
        { emoji: "🌈", unicode: "U+1F308", bytes: "\\uD83C\\uDF08" },
        { emoji: "☔", unicode: "U+2614", bytes: "\\u2614" },
        { emoji: "⚡", unicode: "U+26A1", bytes: "\\u26A1" },
        { emoji: "❄️", unicode: "U+2744", bytes: "\\u2744\\uFE0F" },
      ],
    },
    {
      category: "运动",
      emojis: [
        { emoji: "⚽", unicode: "U+26BD", bytes: "\\u26BD" },
        { emoji: "🏀", unicode: "U+1F3C0", bytes: "\\uD83C\\uDFC0" },
        { emoji: "🏈", unicode: "U+1F3C8", bytes: "\\uD83C\\uDFC8" },
        { emoji: "⚾", unicode: "U+26BE", bytes: "\\u26BE" },
        { emoji: "🎾", unicode: "U+1F3BE", bytes: "\\uD83C\\uDFBE" },
        { emoji: "🏐", unicode: "U+1F3D0", bytes: "\\uD83C\\uDFD0" },
        { emoji: "🏉", unicode: "U+1F3C9", bytes: "\\uD83C\\uDFC9" },
        { emoji: "🥏", unicode: "U+1F94F", bytes: "\\uD83E\\uDD4F" },
        { emoji: "🎱", unicode: "U+1F3B1", bytes: "\\uD83C\\uDFB1" },
        { emoji: "🪀", unicode: "U+1FA80", bytes: "\\uD83E\\uDE80" },
        { emoji: "🏓", unicode: "U+1F3D3", bytes: "\\uD83C\\uDFD3" },
        { emoji: "🥊", unicode: "U+1F94A", bytes: "\\uD83E\\uDD4A" },
        { emoji: "🥋", unicode: "U+1F94B", bytes: "\\uD83E\\uDD4B" },
        { emoji: "⛳", unicode: "U+26F3", bytes: "\\u26F3" },
        { emoji: "⛸️", unicode: "U+26F8", bytes: "\\u26F8\\uFE0F" },
        { emoji: "🎣", unicode: "U+1F3A3", bytes: "\\uD83C\\uDFA3" },
      ],
    },
    {
      category: "交通",
      emojis: [
        { emoji: "🚗", unicode: "U+1F697", bytes: "\\uD83D\\uDE97" },
        { emoji: "🚕", unicode: "U+1F695", bytes: "\\uD83D\\uDE95" },
        { emoji: "🚙", unicode: "U+1F699", bytes: "\\uD83D\\uDE99" },
        { emoji: "🚌", unicode: "U+1F68C", bytes: "\\uD83D\\uDE8C" },
        { emoji: "🚎", unicode: "U+1F68E", bytes: "\\uD83D\\uDE8E" },
        { emoji: "🚓", unicode: "U+1F693", bytes: "\\uD83D\\uDE93" },
        { emoji: "🚑", unicode: "U+1F691", bytes: "\\uD83D\\uDE91" },
        { emoji: "🚒", unicode: "U+1F692", bytes: "\\uD83D\\uDE92" },
        { emoji: "🚚", unicode: "U+1F69A", bytes: "\\uD83D\\uDE9A" },
        { emoji: "🚛", unicode: "U+1F69B", bytes: "\\uD83D\\uDE9B" },
        { emoji: "🚜", unicode: "U+1F69C", bytes: "\\uD83D\\uDE9C" },
        { emoji: "🚲", unicode: "U+1F6B2", bytes: "\\uD83D\\uDEB2" },
        { emoji: "🛵", unicode: "U+1F6F5", bytes: "\\uD83D\\uDEF5" },
        { emoji: "🏍️", unicode: "U+1F3CD", bytes: "\\uD83C\\uDFCD\\uFE0F" },
        { emoji: "🚂", unicode: "U+1F682", bytes: "\\uD83D\\uDE82" },
        { emoji: "✈️", unicode: "U+2708", bytes: "\\u2708\\uFE0F" },
      ],
    },
  ];
});

// 复制到剪贴板功能
const copyToClipboard = (
  emoji: { emoji: string; unicode: string; bytes: string },
  groupIndex: number,
  emojiIndex: number,
) => {
  let copyContent = "";

  if (copyMode.value === "emoji") {
    copyContent = emoji.emoji;
  } else if (copyMode.value === "unicode") {
    copyContent = emoji.unicode;
  } else {
    copyContent = emoji.bytes;
  }

  navigator.clipboard
    .writeText(copyContent)
    .then(() => {
      // 设置当前复制状态
      currentCopiedIndex.value = { groupIndex, emojiIndex };

      // 2秒后重置状态
      setTimeout(() => {
        if (
          currentCopiedIndex.value?.groupIndex === groupIndex &&
          currentCopiedIndex.value?.emojiIndex === emojiIndex
        ) {
          currentCopiedIndex.value = null;
        }
      }, 2000);
    })
    .catch(() => {
      console.error("复制失败");
    });
};

// 获取复制内容预览
const getCopyPreview = (emoji: {
  emoji: string;
  unicode: string;
  bytes: string;
}) => {
  if (copyMode.value === "emoji") {
    return emoji.emoji;
  } else if (copyMode.value === "unicode") {
    return emoji.unicode;
  } else {
    return emoji.bytes;
  }
};

// 检查是否为当前复制的表情
const isCopied = (groupIndex: number, emojiIndex: number) => {
  return (
    currentCopiedIndex.value?.groupIndex === groupIndex &&
    currentCopiedIndex.value?.emojiIndex === emojiIndex
  );
};
</script>

<template>
  <div class="h-screen bg-gray-50 dark:bg-zinc-900 py-6 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 标题和明暗模式切换按钮 -->
      <div class="flex flex-col items-center mb-8 relative">
        <!-- 明暗模式切换按钮 -->
        <button
          @click="toggleTheme"
          class="absolute right-0 top-0 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800"
          aria-label="切换主题"
        >
          <svg
            v-if="isDarkMode"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <!-- 太阳图标 -->
            <path
              fill-rule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <!-- 月亮图标 -->
            <path
              d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
            />
          </svg>
        </button>

        <h1
          class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Unicode Emoji 表情符号
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          点击表情符号复制到剪贴板
        </p>
      </div>

      <!-- 卡片网格布局 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- 复制模式选择器 -->
        <CardView>
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <span class="mr-2">🔄</span>
            复制模式
          </h3>
          <div class="flex flex-wrap gap-4 mb-4">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="copyMode"
                type="radio"
                value="emoji"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span
                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                复制表情符号
              </span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="copyMode"
                type="radio"
                value="unicode"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span
                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                复制Unicode码
              </span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="copyMode"
                type="radio"
                value="bytes"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span
                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                复制字节码
              </span>
            </label>
          </div>

          <div class="border-t border-gray-200 dark:border-zinc-700 pt-3">
            <p class="text-sm text-blue-600 dark:text-blue-400">
              <span v-if="copyMode === 'emoji'"
                >点击表情符号可直接复制该表情</span
              >
              <span v-else-if="copyMode === 'unicode'"
                >点击表情符号可复制其Unicode表示</span
              >
              <span v-else>点击表情符号可复制其字节码表示</span>
            </p>
          </div>
        </CardView>
      </div>

      <!-- 表情符号分组卡片 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <CardView v-for="(group, groupIndex) in emojiGroups" :key="groupIndex">
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <span class="mr-2">😀</span>
            {{ group.category }}
          </h3>

          <div class="border-t border-gray-200 dark:border-zinc-700 pt-4">
            <div class="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-3">
              <div
                v-for="(emoji, emojiIndex) in group.emojis"
                :key="emojiIndex"
                class="relative group"
              >
                <button
                  @click="copyToClipboard(emoji, groupIndex, emojiIndex)"
                  class="w-9 h-9 flex items-center justify-center text-xl bg-gray-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:scale-110 active:scale-95"
                  :class="{
                    'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600':
                      isCopied(groupIndex, emojiIndex),
                  }"
                >
                  {{ emoji.emoji }}
                </button>

                <!-- Tooltip -->
                <div
                  class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
                  :class="{
                    'bg-green-600 dark:bg-green-700': isCopied(
                      groupIndex,
                      emojiIndex,
                    ),
                  }"
                >
                  <span v-if="isCopied(groupIndex, emojiIndex)"
                    >复制成功！</span
                  >
                  <span v-else> 点击复制: {{ getCopyPreview(emoji) }} </span>
                  <div
                    class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900 dark:border-t-gray-700"
                    :class="{
                      'border-t-green-600 dark:border-t-green-700': isCopied(
                        groupIndex,
                        emojiIndex,
                      ),
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardView>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background: rgba(229, 231, 235, 0.3);
}
</style>
