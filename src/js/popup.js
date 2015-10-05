import $ from 'jquery'
import EventEmitter from 'eventemitter3'

function getCurrentTabUrl() {
  return new Promise(function (done, reject) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
      active: true,
      currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
      // chrome.tabs.query invokes the callback with a list of tabs that match the
      // query. When the popup is opened, there is certainly a window and at least
      // one tab, so we can safely assume that |tabs| is a non-empty array.
      // A window can only have one active tab at a time, so the array consists of
      // exactly one tab.
      var tab = tabs[0];

      // A tab is a plain object that provides information about the tab.
      // See https://developer.chrome.com/extensions/tabs#type-Tab
      var url = tab.url;

      // tab.url is only available if the "activeTab" permission is declared.
      // If you want to see the URL of other tabs (e.g. after removing active:true
      // from |queryInfo|), then the "tabs" permission is required to see their
      // "url" properties.
      console.assert(typeof url == 'string', 'tab.url should be a string');

      done(url);
    });
  });
}

class CodeSearchUrl {
    constructor(baseUrl, version, path) {
        this.baseUrl = baseUrl;
        this.version = version;
        this.path = path;
    }

    toUrl() {
        return this.baseUrl + this.version + this.path;
    }

    setVersion(version) {
        this.version = version;
    }

    static parse(urlStr) {
        let matches = urlStr.match(/(http:\/\/tools.oesf.biz\/)([^\/]+)(.+)/);
        if (matches == null) {
            return null;
        }
        return new CodeSearchUrl(matches[1], matches[2], matches[3]);
    }
}

let platforms = [
    { version: 'android-2.2_r1.1', level: 8 },
    { version: 'android-2.3_r1.0', level: 9 },
    { version: 'android-2.3.7_r1.0', level: 10 },
    { version: 'android-4.0.1_r1.0', level: 14 },
    { version: 'android-4.0.3_r1.0', level: 15 },
    { version: 'android-4.0.4_r1.0', level: 15 },
    { version: 'android-4.1.1_r1.0', level: 16 },
    { version: 'android-4.1.2_r1.0', level: 16 },
    { version: 'android-4.2.0_r1.0', level: 17 },
    { version: 'android-4.3.0_r2.1', level: 18 },
    { version: 'android-4.3.0_r2.2', level: 18 },
    { version: 'android-4.3.0_r3.1', level: 18 },
    { version: 'android-4.3.1_r1.0', level: 18 },
    { version: 'android-4.4.0_r1.0', level: 19 },
    { version: 'android-4.4.1_r1.0', level: 19 },
    { version: 'android-4.4.2_r1.0', level: 19 },
    { version: 'android-4.4.3_r1.1', level: 19 },
    { version: 'android-4.4.4_r1.0', level: 19 },
    { version: 'android-4.4w_r1.0', level: 20 },
    { version: 'android-5.0.0_r2.0', level: 21 },
    { version: 'android-5.0.1_r1.0', level: 21 },
    { version: 'android-5.1.0_r1.0', level: 22 },
    { version: 'android-5.1.1_r1.0', level: 22 },
    { version: 'android-5.1.1_r9.0', level: 22 }
];

function hideLoading() {
    $('.loading').addClass('is-hidden');
}
function displayUnsupportedPageText() {
    $('.unsupported-page').removeClass('is-hidden');
}

class PlatformItemView extends EventEmitter {
    constructor(platform) {
        super();

        let $anchor = $('<a href="#">' + platform.version + ' (API' + platform.level + ')</a>');
        let $div = $('<div>');
        $div.append($anchor);
        $anchor.on('click', () => {
            this.emit('click');
        });

        this.$el = $div;
        this.platform = platform;
    }
}

class PlatformsView extends EventEmitter {
    constructor() {
        super();

        let $container = $('<div>');
        platforms.forEach((p, i) => {
            let view = new PlatformItemView(p);
            view.on('click', () => {
                this.emit('click', view.platform);
            });
            $container.append(view.$el);
        });

        this.$el = $container;
    }
}

$(async () => {
    let platformsView = new PlatformsView();
    $('.platforms').append(platformsView.$el);

	try {
		let currentUrl = await getCurrentTabUrl();
        hideLoading();
        let url = CodeSearchUrl.parse(currentUrl);
        if (url === null) {
            displayUnsupportedPageText();

            platformsView.on('click', (platform) => {
                let version = platform.version;
                chrome.tabs.update({
                    url: 'http://tools.oesf.biz/' + version
                });
            });
            return;
        }

        platformsView.on('click', (platform) => {
            let version = platform.version;
            if (url.version == version) {
                return;
            }
            url.setVersion(version);
            console.log(url.toUrl());
            chrome.tabs.update({
                url: url.toUrl()
            });
        });
	} catch (err) {
        console.log(err);
	}
});
