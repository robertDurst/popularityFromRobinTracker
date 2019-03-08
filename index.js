const axios = require('axios');


function formatDate(x) {
	const date = new Date(x);
	return `${date.getUTCMonth()+1}/${date.getUTCDate()}/${date.getUTCFullYear()}`
}

function getSaveFileDate() {
	const date = new Date();
	return `${date.getUTCMonth()+1}_${date.getUTCDate()}_${date.getUTCFullYear()}`
}

async function getAllPopularity(ticker)
{
	try {
		// get data
		const url = "https://robintrack.net/api/stocks/" + ticker + "/popularity_history";
		const { data } = await axios.get(url);

		// format data
		const formattedData = data.map(x => ({
			popularity: x.popularity,
			date: formatDate(x.timestamp),
		}));

		// group by date
		const groupedData = formattedData.reduce( (map, x) => {
			if (map[x.date]) { map[x.date].push(x.popularity); }
			else {
				map[x.date] = [x.popularity];
			}

			return map;
		}, {});
		
		// consolidate data by date by averaging the data
		const consolidatedData = Object.keys(groupedData).reduce( (retArr, date) => {
			const averagePopularity = groupedData[date].reduce((sum, pop) => sum + pop);
			const numGoodDays = groupedData[date].filter(x => x != 0);
			
			let map = {};
			map.date = date;
			map.popularity = averagePopularity / numGoodDays.length;
	
			retArr.push(map)

			return retArr;
		}, []);
	
		return consolidatedData;
	} catch (err) {
		console.log("Ticker not found!");
	}
}


const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ticker: ', async (answer) => {
	try {
  		const resp = await getAllPopularity(answer.toUpperCase());
		if (resp) {
			// save to csv
			const createCSVWriter = require('csv-writer').createObjectCsvWriter;
			const CSVWriter = createCSVWriter({
				path: `${answer}_${getSaveFileDate()}.csv`,
				header: [
					{id: 'popularity', title: 'Popularity'},
					{id: 'date', title: 'Date'},
				]
			});

			CSVWriter
				.writeRecords(resp)
				.then(()=> console.log(`The CSV file was written successfully: ${answer}_${getSaveFileDate()}.csv`)); 
		}
	} catch (err) {
		// should not get here
	}

  rl.close();
});
