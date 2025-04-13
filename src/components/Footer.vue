<script setup>
const text = "© 2025 Zhixia."
const slogan = "我们被我们塑造的东西所塑造着"
const github = "Github"

</script>

<template>
    <div class="footer">
        <div class="footer-content">
            <p class="text">
                {{ text }} &nbsp;
                <a href="https://github.com/zxzxovo" target="_blank">{{ github }}</a>
            </p>
            <q class="slogan">{{ slogan }}</q>
        </div>
    </div>
</template>

<style scoped>
.footer {
    background-color: #424242; /* Grey 800*/
    text-align: center;
    font-size: 0.8rem;
    color: #eee;
    margin-top: 2rem;
    padding: 1rem 0;
}
p {
    margin: 0.5rem 0;
}

</style>