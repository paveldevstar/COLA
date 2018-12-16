const puppeteer = require('puppeteer');
const chalk = require('chalk')

class PuppeteerBot {
  constructor({
    base_url,
    start_date,
    end_date,
    preferNonHeadless = false
  }) {
    this.base_url = base_url;
    this.start_date = start_date;
    this.end_date = end_date;
    this.preferNonHeadless = preferNonHeadless
  }

  async startBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: !this.preferNonHeadless,
        args: [
          '--no-sandbox',
        ],
      });
    }

    this.browser.on('error', () => {

    });

    this.browser.on('disconnected', () => {
      this.browser = null;
    })
    if (!this.page) {
      this.page = await this.browser.newPage();
      this.page.on('error', () => {
        console.log(chalk.red('🚀 Page Reload'))
        this.page.reload()
      })
    }
  }

  async gotoSearchPage() {
    if (!this.page) {
      await this.startBrowser();
    }
    let url = this.base_url ? this.base_url : 'https://www.ttbonline.gov/colasonline/publicSearchColasAdvancedProcess.do';
    await this.page.goto(url, {
      timeout: 0
    })
  }

  async startSearch(start_date = null, end_date = null) {
    try {
      if (!this.page) {
        await this.gotoSearchPage();
      }
      const FROM_SELECTOR = 'input[name=\"searchCriteria.dateCompletedFrom\"]';
      const TO_SELECTOR = 'input[name=\"searchCriteria.dateCompletedTo\"]';
      const BUTTON_SELECTOR = 'input[type=\"submit\"]';
      let elem = await this.page.waitFor(FROM_SELECTOR);
      await elem.focus();
      // await this.page.keyboard.type(start_date ? start_date : this.start_date, {
      //   delay: 200
      // });
      let s = start_date ? start_date : this.start_date;
      await this.page.evaluate((FROM_SELECTOR, s) => {
        document.querySelector(FROM_SELECTOR).value = s
      }, FROM_SELECTOR, s)
      await this.randomSleep(1000)
      elem = await this.page.waitFor(TO_SELECTOR);
      await elem.focus();
      // await this.page.keyboard.type(end_date ? end_date : this.end_date, {
      //   delay: 200
      // });
      let e = end_date ? end_date : this.end_date;
      await this.page.evaluate((TO_SELECTOR, e) => {
        document.querySelector(TO_SELECTOR).value = e;
      }, TO_SELECTOR, e)
      await this.randomSleep(1000)
      const navigationPromise = this.page.waitForNavigation();
      await this.page.click(BUTTON_SELECTOR);
      await navigationPromise;
    } catch (err) {
      console.log(err)
      throw (err)
    }
  }

  async getLinks() {
    try {
      if (!this.page) {
        await this.startSearch();
      }
      let id_array = [];
      const NEXT_SELECTOR = '.pagination > a[href=\"publicPageAdvancedCola.do?action=page&pgfcn=nextset\"]' // This is last a tag
      const LINK_1 = '.box > table > tbody > tr.lt > td > a'
      const LINK_2 = '.box > table > tbody > tr.dk > td > a'
      while (await this.page.$(NEXT_SELECTOR) !== null) {
        id_array = id_array.concat(await this.page.evaluate(async (LINK_1, LINK_2) => {
          let elements = document.querySelectorAll(LINK_1)
          let arr = [];
          for (let i = 0; i < elements.length; i++) {
            arr.push(elements[i].innerHTML);
          }
          elements = document.querySelectorAll(LINK_2)
          for (let i = 0; i < elements.length; i++) {
            arr.push(elements[i].innerHTML);
          }
          return arr
          // return links
        }, LINK_1, LINK_2));
        await this.page.click(NEXT_SELECTOR);
        await this.randomSleep(500)
      }
      return id_array;
    } catch (err) {
      throw (err)
    }
  }

  async extractFromID(_id) {
    try {
      if (!this.page) {
        await this.startBrowser()
      }
      let url = 'https://www.ttbonline.gov/colasonline/viewColaDetails.do?action=publicDisplaySearchAdvanced&ttbid='+_id;
      await this.page.goto(url, {timeout: 0})
    } catch (err) {
      console.log(err);
      throw (err);
    }   
  }

  randomSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.ceil(Math.random() * ms)));
  }
}

module.exports = PuppeteerBot