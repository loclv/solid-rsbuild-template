import { render } from '@solidjs/web';
import App from './App';
import { registerPwa } from './pwa';

registerPwa();

const root = document.getElementById('root');
if (root) {
  render(() => <App />, root);
}
