import initRelatedBlogsSlider from './related-blogs-slider';
import { initRelativeDates, initBlogBadges } from './date-badge';
import initSearchLoadMore from './search-load-more';
import initBlogLede from './blog-lede';
import initBlogActions from './blog-actions';

export default function initBlogCustom() {
    initRelatedBlogsSlider();
    initRelativeDates();
    initBlogBadges();
    initSearchLoadMore();
    initBlogLede();
    initBlogActions();
}
