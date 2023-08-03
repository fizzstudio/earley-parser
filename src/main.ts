
import { TabView, TabViewPage } from '@fizz/ui-components';
import { getContent as nlpContent } from './demo_nlp/demo';


window.addEventListener('load', () => new Demo());

export class Demo {
  constructor() {   
    this.init();
  }
  
  async init() {
    const tv = new TabView(this);
    const tp1 = new TabViewPage(this, 'NLP');
    const div1 = document.createElement('div');
    div1.innerHTML = nlpContent();
    tp1.addContent(div1);
    tv.addPage(tp1);
    tv.appendToContainer(document.getElementById('content-container')!);
  }

}
