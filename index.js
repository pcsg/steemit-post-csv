var Form   = document.querySelector('Form');
var Input  = document.querySelector('[name="url"]');
var Result = document.querySelector('.result');

var generate = function (author, permlink) {
    return new Promise(function (resolve) {
        console.log('call api');

        steem.api.getContentReplies(author, permlink, function (err, result) {
            var i, len, entry, votes, link, Calc;
            var data = [];
            var List = [];

            for (i = 0, len = result.length; i < len; i++) {
                console.log('Parse ...' + i);

                entry = result[i];
                votes = '';
                link  = '';

                if (entry.author === 'minnowpond') {
                    continue;
                }

                if (entry.body.indexOf('https://') === -1) {
                    continue;
                }

                link = getLink(entry.body);

                if (!link) {
                    continue;
                }

                Calc = getVote(entry.author, entry.permlink).then(function (res) {
                    data.push({
                        author: this.author,
                        link  : this.link,
                        votes : res.votes,
                        weight: res.weight
                    });
                }.bind({
                    author: entry.author,
                    link  : link
                }));

                List.push(Calc);
            }

            Promise.all(List).then(function () {
                downloadCSV(data);
                resolve();
            });
        });
    });
};

/**
 *
 * @param author
 * @param permlink
 * @return {Promise}
 */
var getVote = function (author, permlink) {
    return new Promise(function (resolve) {
        steem.api.getContent(author, permlink, function (err, result) {
            var weight = 0;
            var votes  = result.active_votes;

            for (var i = 0, len = votes.length; i < len; i++) {
                weight = weight + votes[i].weight;
            }

            resolve({
                votes : result.active_votes.length,
                weight: weight
            });
        });
    });
};

/**
 * Return the Beer Link
 *
 * @param body
 * @return {String|Boolean}
 */
var getLink = function (body) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    body = body.replace(exp, "<a href='$1'>$1</a>");

    var Ghost       = document.createElement('div');
    Ghost.innerHTML = body;

    var result = [];
    var links  = Ghost.querySelectorAll('a');

    // beer filter :D
    links.forEach(function (Link) {
        if (Link.href.indexOf('https://steemit.com/beer/') !== -1 ||
            Link.href.indexOf('https://steemit.com/beersaturday/') !== -1) {
            result.push(Link.href);
        }
    });

    if (result.length) {
        return result[0];
    }

    return false;
};

Form.addEventListener('submit', function (event) {
    event.preventDefault();

    var value = Input.value,
        Url   = new URI(value);

    if (value.indexOf('https://steemit.com') === -1) {
        console.error('No Steemit Url');
        return;
    }

    var path  = Url.path(),
        parts = path.split('/');

    var author   = parts[2].replace('@', '');
    var permlink = parts[3];

    console.warn(author);
    console.warn(permlink);

    Result.style.display = '';

    generate(author, permlink).then(function () {
        Result.style.display = 'none';
    });
});