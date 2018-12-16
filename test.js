var PuppeteerBot = require('./bot/puppeteerbot')

const bot = new PuppeteerBot({
  base_url: 'https://www.ttbonline.gov/colasonline/publicSearchColasAdvancedProcess.do',
  start_date: '12/01/2017',
  end_date: '12/02/2017',
  preferNonHeadless: true
});

async function test() {
  await bot.startSearch()
  let id_array = await bot.getLinks()
  for (let i = 0; i < id_array.length; i++) {
    let v = await bot.extractFromID(id_array[i])
    console.log(v)
  }
}

test();