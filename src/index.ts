import { Network } from './network/network';

const network = new Network('div#network');

const node = network.createNode();
network.addElement(node);
network.syncView();
node.x = 12;
node.y = 12;
