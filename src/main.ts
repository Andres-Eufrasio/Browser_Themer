import { createApp } from 'vue';
import App from './App.vue';

import '@unocss/reset/tailwind.css';
import 'uno.css';

import { useStorageVersioning } from './utils';

useStorageVersioning('16/10/26');

createApp(App).mount('#app');
