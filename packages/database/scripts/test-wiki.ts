import axios from 'axios'; axios.get('https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads').then(() => console.log('EXISTS')).catch(e => console.log('DOES NOT EXIST'));
