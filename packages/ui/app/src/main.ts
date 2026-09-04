import { createApp } from 'vue'
import App from './App.vue'
import './styles/neon.css'

const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
document.head.appendChild(fontLink)

createApp(App).mount('#app')
