import { Network } from './network/network';

const network = new Network('div#network');

for (let i: number = 0, len: number = 2000; i < len;) {
  i += 1;
  const node = network.createNode();
  network.addElement(node);
  network.syncView();
  node.x = Math.random() * 1200;
  node.y = Math.random() * 900;
}
