<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const headTitle = "Zhixia's Site"
const subTitle = "吾生梦幻间，何事绁尘羁"
const mobileMenuOpen = ref(false)

const router = useRouter()
const navToHome = () => {
    router.push({ name: 'Home' })
}

const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value
}

</script>

<template>
    <div class="header">
        <div class="title">
            <h1 @click="navToHome()">{{ headTitle }}</h1>
            <h2>{{ subTitle }}</h2>
        </div>

        <!-- Mobile Menu Toggle  -->
        <div class="navbar desktop-nav">
            <router-link :to="{ name: 'Blog' }" class="router-link">
                <div class="nav-item">Blog</div>
            </router-link>
            <router-link :to="{ name: 'Projects' }" class="router-link">
                <div class="nav-item">Projects</div>
            </router-link>
            <router-link :to="{ name: 'Services' }" class="router-link">
                <div class="nav-item">Services</div>
            </router-link>
            <router-link :to="{ name: 'About' }" class="router-link">
                <div class="nav-item">About</div>
            </router-link>
        </div>

        <!-- Mobile Menu Toggle -->
        <div class="mobile-menu-toggle" @click="toggleMobileMenu">
            <div class="hamburger" :class="{ 'open': mobileMenuOpen }">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>

        <!-- Mobile Menu -->
        <div class="mobile-menu" :class="{ 'open': mobileMenuOpen }">
            <router-link :to="{ name: 'Blog' }" class="mobile-router-link" @click="toggleMobileMenu">
                <div class="mobile-nav-item">Blog</div>
            </router-link>
            <router-link :to="{ name: 'Projects' }" class="mobile-router-link" @click="toggleMobileMenu">
                <div class="mobile-nav-item">Projects</div>
            </router-link>
            <router-link :to="{ name: 'Services' }" class="mobile-router-link" @click="toggleMobileMenu">
                <div class="mobile-nav-item">Services</div>
            </router-link>
            <router-link :to="{ name: 'About' }" class="mobile-router-link" @click="toggleMobileMenu">
                <div class="mobile-nav-item">About</div>
            </router-link>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.header {
    width: 100%;
    height: 16rem;
    background: linear-gradient(120deg, #303F9F, #5C6BC0);
    /* Indigo 700 -> 400 */
    display: flex;
    flex-direction: column;
    color: #eee;
    align-items: center;
    transition: all 0.3s ease-in-out;
    position: relative;
}

.title {
    flex: 1 0 auto;
    width: 20rem;
    text-align: center;
    align-content: center;
    transition: all 0.3s ease-in-out;
}

.title>h2 {
    font-weight: 300;
    font-size: 1.2rem;
}

.navbar {
    flex: 0 0 3rem;
    display: flex;
    width: min-content;
    flex-direction: row;
    justify-content: center;
    padding: 0 20%;
    align-content: center;
}

a {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ddd;
    margin: 0 1rem;
}

a:hover {
    text-decoration: none;
    color: #fff;
}

.router-link>.nav-item {
    height: 100%;
    width: 5rem;
    text-align: center;
    align-content: center;
    margin: 0 6px;
    cursor: pointer;
}

// Mobile Menu Toggle
.mobile-menu-toggle {
    display: none;
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 100;
    cursor: pointer;
}

.hamburger {
    width: 24px;
    height: 18px;
    position: relative;

    span {
        display: block;
        position: absolute;
        height: 3px;
        width: 95%;
        background: #fff;
        border-radius: 2px;
        transition: all 0.3s ease;

        &:nth-child(1) {
            top: 0;
        }

        &:nth-child(2) {
            top: 8px;
        }

        &:nth-child(3) {
            top: 16px;
        }
    }

    &.open {
        span {
            &:nth-child(1) {
                transform: rotate(45deg);
                top: 8px;
            }

            &:nth-child(2) {
                opacity: 0;
            }

            &:nth-child(3) {
                transform: rotate(-45deg);
                top: 8px;
            }
        }
    }
}

// Mobile Secondary Menu
.mobile-menu {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(120deg, #303F9F, #5C6BC0);
    padding-top: 5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    transition: transform 0.3s ease-in-out;
    z-index: 50;

    &.open {
        transform: translateY(0);
    }
}

.mobile-router-link {
    display: block;
    padding: 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 1.2rem;

    &:last-child {
        border-bottom: none;
    }
}

.mobile-nav-item {
    padding: 0.5rem 0;
}


.header:has(.router-link-active) {
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;

    .title {
        flex: 0 1 20%;
        height: 100%;

        h1 {
            height: 4rem;
            font-size: 1.5rem;
            align-content: center;
            font-weight: 700;
            cursor: pointer;
        }

        h2 {
            display: none;
        }
    }

    .navbar {
        flex: 1 1 auto;
        height: 4rem;
        padding: 0 2rem;
        justify-content: flex-end;

        .router-link {
            border-radius: 0.5rem;
            margin: 15px 10px;
            font-weight: 700;
            transition: all 0.3s linear;
        }

        .router-link-active {
            background-color: #F06292;
            /* Pink 200 */
            color: #fff;
        }
    }
}

// Mobile Reactive
@media (max-width: 768px) {
    .desktop-nav {
        display: none;
    }

    .mobile-menu-toggle {
        display: block;
    }

    .mobile-menu {
        display: block;
    }

    .header {
        height: 8rem;

        .title {
            width: 100%;
            padding: 1rem;

            h1 {
                font-size: 1.5rem;
                margin-bottom: 0.3rem;
            }

            h2 {
                font-size: 1rem;
            }
        }
    }

    .header:has(.router-link-active) {
        height: 4rem;

        .title {
            flex: 1;
            width: auto;
            text-align: left;
            padding-left: 1rem;

            h1 {
                font-size: 1.2rem;
                height: auto;
            }
        }

        .mobile-router-link.router-link-active {
            background-color: #F06292;
        }
    }
}
</style>