import { Edge as _Edge } from './edge';
import { Group as _Group } from './group';
import { Node as _Node } from './node';

namespace ElementsTypes {
  export class Node extends _Node {};
  export class Edge extends _Edge {};
  export class Group extends _Group {};
}

export = ElementsTypes;