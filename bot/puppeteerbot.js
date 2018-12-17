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

  extractInfo(dom) {
    if (dom.includes('<strong>TTB ID: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, ''); // This replaces <stong> Title </stong>
      dom = dom.replace(/<a[\s\S]+<\/a>/g, ''); // This replaces quote mark link
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, ''); // This removes all multiple lines
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, ''); // This removes all leading and trimming spaces
      return {
        ttb_id: dom
      };
    } else if (dom.includes('<strong>Status: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        status: dom
      }
    } else if (dom.includes('<strong>Vendor Code: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        vendor_code: dom
      }
    } else if (dom.includes('<strong>Serial #: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        serial: dom
      }
    } else if (dom.includes('<strong>Class/Type Code: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        type_code: dom
      }
    } else if (dom.includes('<strong>Origin Code: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        origin_code: dom
      }
    } else if (dom.includes('<strong>Brand Name: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        brand_name: dom
      }
    } else if (dom.includes('<strong>Fanciful Name: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        fanciful_name: dom
      }
    } else if (dom.includes('<strong>Type of Application: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        type_application: dom
      }
    } else if (dom.includes('<strong>For Sale In: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        sale_id: dom
      }
    } else if (dom.includes('<strong>Total Bottle Capacity: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        total_bottle_capacity: dom
      }
    } else if (dom.includes('<strong>Formula : </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        formula: dom
      }
    } else if (dom.includes('<strong>Approval Date:</strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        approval_date: dom
      }
    } else if (dom.includes('<strong>Qualifications: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        qualifications: dom
      }
    } else if (dom.includes('<strong>Lab No./Lab Date: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        lab_no_date: dom
      }
    } else if (dom.includes('<strong>Grape Varietal(s): </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        grape_varietal: dom
      }
    } else if (dom.includes('<strong>Wine Vintage: </strong>')) {
      dom = dom.replace(/<strong>[\s\S]+<\/strong>/g, '');
      dom = dom.replace(/<a[\s\S]+<\/a>/g, '');
      dom = dom.replace(/(\r\n\t|\n|\r\t)/gm, '');
      dom = dom.replace(/s\/^\s+|\s+$|\s+(?=\s)\s+/g, '');
      dom = dom.replace(/&nbsp;/g, '');
      return {
        wine_vintage: dom
      }
    }
  }

  async extractFromID(_id) {
    let ret = {} // This is container of extracted data
    try {
      if (!this.page) {
        await this.startBrowser()
      }
      let url = 'https://www.ttbonline.gov/colasonline/viewColaDetails.do?action=publicDisplaySearchAdvanced&ttbid=' + _id; // url of each page
      await this.page.goto(url, {
        timeout: 0
      })

      // This is first box part of details page
      const PART_1 = '.box:nth-of-type(1) > table > tbody > tr > td'
      let html_list = await this.page.evaluate(async (PART_1) => {
        let elements = document.querySelectorAll(PART_1);
        let arr = [];
        for (let i = 0; i < elements.length; i++) {
          arr.push(elements[i].innerHTML);
        }
        return arr;
      }, PART_1);
      
      for (let i = 0; i < html_list.length; i++) {
        let v = this.extractInfo(html_list[i])
        if (v) {
          ret = Object.assign(v, ret);
        }
      }

      // This is  second box part of details page
      const PART_2 = '.box:nth-of-type(2) > table > tbody > tr > td'
      html_list = await this.page.evaluate(async (PART_2) => {
        let elements = document.querySelectorAll(PART_2);
        let arr = [];
        for (let i = 0; i < elements.length; i++) {
          arr.push(elements[i].innerHTML);
        }
        return arr;
      }, PART_2);
      
      for (let i = 0; i < html_list.length; i++) {
        let v = this.extractInfo(html_list[i])
        if (v) {
          ret = Object.assign(v, ret);
        }
      }
      console.log(ret);

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