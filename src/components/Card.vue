<script setup lang="ts">

</script>

<template>
    <div class="card">

        <div v-if="$slots.header" class="header">
            <slot name="header"></slot>
            <p class="card-divider">&nbsp;</p>
        </div>

        <div v-if="$slots.content" class="content">
            <slot name="content"></slot>
        </div>

        <div v-if="$slots.footer" class="footer">
            <p class="card-divider">&nbsp;</p>
            <slot name="footer"></slot>
        </div>

    </div>
</template>

<style lang="scss" scoped>
.card {
    background-color: #FAFAFA;
    border: 1px solid #D7CCC8;
    border-radius: 5px;
    box-shadow: 0 2px 4px 0 #BDBDBD;
    padding: 1rem;

    .header {
        .card-divider {
            width: 100%;
            height: 0;
            border-bottom: 1px solid #D7CCC8;
            margin: 0.8rem 0;
        }
    }

    .footer {
        .card-divider {
            width: 100%;
            height: 0;
            padding: 0;
            margin: 0.5rem 0;
        }
    }
}


</style>