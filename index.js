var Form   = document.querySelector('Form');
var Input  = document.querySelector('[name="url"]');
var Result = document.querySelector('.result');

var server = 'wss://steemd-int.steemit.com';

steem.api.setOptions({
    url: server
});

var generate = function (author, permlink) {
    return new Promise(function (resolve) {
        console.log('call api');

        Promise.all([
            steem.api.getContent(author, permlink),
            steem.api.getContentReplies(author, permlink)
        ]).then(function (result) {
            var i, len, entry, votes, link, Calc;
            var data = [];
            var List = [];

            var postData = result[0];
            var replies  = result[1];

            for (i = 0, len = replies.length; i < len; i++) {
                console.log('Parse ...' + i);

                entry = replies[i];
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
                
                Calc = getTagsFromPost(entry.author, link).then(function (results) {
                    return results.indexOf('beersaturday');
                }).then(function (hasBeersaturday) {
                    if (hasBeersaturday === -1) {
                        return;
                    }

                    var voteSelf = this;

                    return getVote(this.author, getPermalinkFromUrl(this.link)).then(function (res) {
                        var author   = voteSelf.author;
                        var beerVote = postData.active_votes.filter(function (entry) {
                            return author === entry.voter;
                        });

                        if (beerVote.length) {
                            beerVote = beerVote[0].percent;
                        } else {
                            beerVote = 0;
                        }

                        data.push({
                            'Author'            : author,
                            'Link'              : voteSelf.link,
                            'Post Votes'        : res.votes,
                            'Post Weight'       : res.weight,
                            'Beer Vote'         : beerVote,
                            'Beer Vote %'       : (beerVote / 100) + '%',
                            'Beer Comment Votes': voteSelf.net_votes
                        });
                    });
                }.bind({
                    author   : entry.author,
                    net_votes: entry.net_votes,
                    link     : link
                }));

                List.push(Calc);
            }

            Promise.all(List).then(function () {
                console.warn(data);

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
        if (Link.href.indexOf('https://steemit.com/') !== -1) {
            result.push(Link.href);
        }
    });

    if (result.length) {
        return result[0];
    }

    return false;
};

/**
 * Return all tags from a steemit post
 *
 * @param {String} author
 * @param {String} link
 * @return {Promise}
 */
var getTagsFromPost = function (author, link) {
    var permlink = getPermalinkFromUrl(link);

    return steem.api.getContent(author, permlink).then(function (res) {
        var metaData = {};

        try {
            metaData = JSON.parse(res.json_metadata);
        } catch (e) {
        }

        if ("tags" in metaData) {
            return metaData.tags;
        }

        return [];
    });
};

/**
 * Return the permalink part from a steemit url
 *
 * @param value
 * @return {String}
 */
var getPermalinkFromUrl = function (value) {
    var Url = new URI(value);

    if (value.indexOf('https://steemit.com') === -1) {
        console.error('No Steemit Url');
        return '';
    }

    var path  = Url.path(),
        parts = path.split('/');

    return parts[3];
};

/**
 * Form
 */
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