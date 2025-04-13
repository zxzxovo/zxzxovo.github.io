import { createApp } from 'vue'
import router from './routers/index'
import pinia from './stores'

import App from './App.vue'


const app = createApp(App)

app.use(router)
app.use(pinia)
app.mount('#app')