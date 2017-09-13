function convertArrayOfObjectsToCSV(data) {
    var result, ctr, keys, columnDelimiter, lineDelimiter;

    if (data === null || !data.length) {
        return null;
    }

    columnDelimiter = ',';
    lineDelimiter   = '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function (item) {
        ctr = 0;
        keys.forEach(function (key) {
            if (ctr > 0) result += columnDelimiter;

            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });

    return result;
}

function downloadCSV(data) {
    var csv = convertArrayOfObjectsToCSV(data);

    // console.warn(csv);

    if (csv === null) return;

    if (!csv.match(/^data:text\/csv/i)) {
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }

    console.warn(encodeURI(csv));

    var link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'export.csv');
    link.click();
}