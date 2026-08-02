import initCommonCustom from './common/index';
import initHomepageCustom from './homepage/index';
import initProductCustom from './product/index';
import initWidgetsCustom from './widgets/index';
import initBlogCustom from './blog/index';
import initRecipesCustom from './recipes/index';
import initCategoryCustom from './category/index';

export default function initNexylCustom() {
    initCommonCustom();
    initHomepageCustom();
    initProductCustom();
    initWidgetsCustom();
    initBlogCustom();
    initRecipesCustom();
    initCategoryCustom();
}
