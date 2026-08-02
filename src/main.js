import { createApp } from 'vue'
import App from './App.vue'
import '@fortawesome/fontawesome-free/css/all.css'
import router from './router'
import './css/main.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
