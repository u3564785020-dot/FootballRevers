
    (function() {
      var cdnOrigin = "https://cdn.shopify.com";
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.TiXrO7Ka.js","/cdn/shopifycloud/checkout-web/assets/c1/app.C6l9rVta.js","/cdn/shopifycloud/checkout-web/assets/c1/en.DQFQAfju.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage.CeeKentd.js","/cdn/shopifycloud/checkout-web/assets/c1/DeliveryMethodSelectorSection.D_X_QMoD.js","/cdn/shopifycloud/checkout-web/assets/c1/useEditorShopPayNavigation.B1NsfwUT.js","/cdn/shopifycloud/checkout-web/assets/c1/VaultedPayment.Dn1BNlq4.js","/cdn/shopifycloud/checkout-web/assets/c1/LocalizationExtensionField.Dmi0pspO.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayOptInDisclaimer.CoO6Ycu8.js","/cdn/shopifycloud/checkout-web/assets/c1/SeparatePaymentsNotice.CY9bHTji.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.BK4zylTD.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.Cdht34b9.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview.hNGjJspr.js","/cdn/shopifycloud/checkout-web/assets/c1/component-ShopPayVerificationSwitch.ok9-cEuw.js","/cdn/shopifycloud/checkout-web/assets/c1/useSubscribeMessenger.BT42CNvd.js","/cdn/shopifycloud/checkout-web/assets/c1/index.BvDzvEBf.js","/cdn/shopifycloud/checkout-web/assets/c1/PayButtonSection.Br_bUDJr.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.DTauGz07.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.PMX4OSBO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DeliveryMethodSelectorSection.BvrdqG-K.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useEditorShopPayNavigation.CBpWLJzT.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/VaultedPayment.OxMVm7u-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StackedMerchandisePreview.CKAakmU8.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShopPayVerificationSwitch.WW3cs_z5.css"];
      var fontPreconnectUrls = ["https://fonts.shopifycdn.com"];
      var fontPrefetchUrls = ["https://fonts.shopifycdn.com/barlow/barlow_n4.038c60d7ea9ddb238b2f64ba6f463ba6c0b5e5ad.woff2?h1=Z29hbHRpY2tldHMuY29t&hmac=bb24c2754e267d070a22c4443cfcb8a43eb8e37df78ca5651736eea42d1d8143","https://fonts.shopifycdn.com/barlow/barlow_n7.691d1d11f150e857dcbc1c10ef03d825bc378d81.woff2?h1=Z29hbHRpY2tldHMuY29t&hmac=e33f5a6377d121de3560aa3c49b6a85b1c7d5cd38507e8971c40d101d254ad86"];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0613/4412/1024/files/GOAL_TICKETS_4_x320.png?v=1706568752"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [cdnOrigin].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  