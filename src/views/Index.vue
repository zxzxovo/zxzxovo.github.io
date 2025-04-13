<script setup>
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'

</script>

<template>
    <div class="container">

        <div class="header">
            <Header/>
        </div>

        <div class="main">
            <router-view name="main"/>
        </div>

        <div class="Footer">
            <Footer/>
        </div>
    </div>
</template>


<style scoped>
.container {
    width: 100%;
    overflow-y: auto;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.header {
    flex: 0 0 auto;
    position: sticky;
    position: -webkit-sticky;
    top: 0;
    z-index: 1000;
}
.header:not(:has(router-link-active)) {
    flex: 0 0 auto;
    position: relative;
    transition: all 0.3s ease-in-out;
}
.main {
    flex: 1 0 auto;
    margin: 1rem 1rem;
}
.footer {
    flex: 0 0 auto;
}
</style>