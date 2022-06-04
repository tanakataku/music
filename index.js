const { Client, Intents, MessageActionRow, MessageSelectMenu, MessageButton, Modal, TextInputComponent } = require('discord.js');
require('dotenv').config();
const slash_data = require("./slash.json")
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });
const { Player, RepeatMode } = require("discord-music-player");
const yts = require('yt-search')
const player = new Player(client, {
    leaveOnEmpty: true,
});
let guild = [];
const vol_select = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId('vol_select')
            .setPlaceholder('クイック音量')
            .addOptions([
                {
                    label: '1',
                    description: '音量を1にします',
                    value: '1',
                },
                {
                    label: '10',
                    description: '音量を10にします',
                    value: '10',
                }, {
                    label: '20',
                    description: '音量を20にします',
                    value: '20',
                }, {
                    label: '30',
                    description: '音量を30にします',
                    value: '30',
                }, {
                    label: '40',
                    description: '音量を40にします',
                    value: '40',
                }, {
                    label: '50',
                    description: '音量を50にします',
                    value: '50',
                }, {
                    label: '60',
                    description: '音量を60にします',
                    value: '60',
                }, {
                    label: '70',
                    description: '音量を70にします',
                    value: '70',
                }, {
                    label: '80',
                    description: '音量を80にします',
                    value: '80',
                }, {
                    label: '90',
                    description: '音量を90にします',
                    value: '90',
                }, {
                    label: '100',
                    description: '音量を100にします',
                    value: '100',
                },
            ]),
    );
const option_button = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('vol_button')
            .setLabel('音量設定')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('seek_button')
            .setLabel('再生場所指定')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('queueloop_button')
            .setLabel('キューをループ')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('loop_button')
            .setLabel('曲をループ')
            .setStyle('PRIMARY'),
    );
const option_button2 = new MessageActionRow()
    .addComponents(
        new MessageButton()
        .setCustomId('stop_loop_button')
        .setLabel('ループ停止')
        .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('pause_button')
            .setLabel('一時停止')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('resume_button')
            .setLabel('再開')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('skip_button')
            .setLabel('スキップ')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('stop_button')
            .setLabel('Stop')
            .setStyle('DANGER'),
    );
const vol_modal = new Modal()
    .setCustomId('vol_Modal')
    .setTitle('音量詳細設定画面');
vol_modal.addComponents(
    new MessageActionRow().addComponents(
        new TextInputComponent()
            .setCustomId('vol')
            .setLabel("音量を数字で0~100までを入力してください")
            .setStyle('SHORT')
            .setMaxLength(3)
            .setMinLength(1)
            .setPlaceholder("0~100まで")
            .setRequired(true)
    )
);
const seek_modal = new Modal()
    .setCustomId('seek_Modal')
    .setTitle('音量詳細設定画面');
seek_modal.addComponents(
    new MessageActionRow().addComponents(
        new TextInputComponent()
            .setCustomId('seek')
            .setLabel("再生したい時間を数字で入力してください")
            .setStyle('SHORT')
            .setMinLength(1)
            .setPlaceholder("数字を入力")
            .setRequired(true)
    )
);
client.player = player;
player.on('queueEnd', async data => {
    await data.guild.channels.cache.get(guild[data.guild.id])?.send({
        embeds: [{
            title: "お知らせ",
            description: "全ての曲の再生が終了しました",
            color: 0x006400
        }]
    }).catch(() => { });
    delete guild[data.guild.id];
})
client.on("ready", async () => {
    await client.application.commands.set(slash_data, "");
    client.user.setActivity('/play', { type: 'LISTENING' });
    console.log(`完了!${client.user.username}`);
});
client.on("interactionCreate", async interaction => {
    guild[interaction.guildId] = interaction.channelId;
    let guildQueue = await client.player.getQueue(interaction.guildId);
    if (!interaction.member.voice.channel) return interaction.followUp({
        embeds: [{
            color: 0xff1100,
            title: "エラー",
            description: `ボイスチャンネルに参加してください。`
        }]
    });
    if (!interaction.guild.me.permissionsIn(interaction.member.voice.channel).has("1048576")) return interaction.followUp({
        embeds: [{
            color: 0xff1100,
            title: "エラー",
            description: '私にボイスチャンネル接続権限がないです。'
        }]
    });
    if (!interaction.guild.me.permissionsIn(interaction.member.voice.channel).has('2097152')) return interaction.followUp({
        embeds: [{
            color: 0xff1100,
            title: "エラー",
            description: '私にボイスチャンネル発言権限がないです。'
        }]
    });
    if (interaction.isCommand()) {
        if (interaction.commandName == "play") {
            await interaction.deferReply();
            const search = interaction.options.getString('url_or_words');
            if (search.startsWith("https://")) {//URLの場合
                const playlist_check = search.split("&")[1]
                if (playlist_check) {//プレイリストであった場合
                    let queue = client.player.createQueue(interaction.guildId);
                    await queue.join(interaction.member.voice.channel);
                    let song = await queue.playlist(search).catch(_ => {
                        interaction.followUp({
                            embeds: [{
                                color: 0xff1100,
                                title: "エラー",
                                description: 'プレイリストが見つかりませんでした'
                            }]
                        });
                        if (!guildQueue)
                            queue.stop();
                    });
                    await interaction.followUp({
                        embeds: [{
                            title: `${(guildQueue) ? "キューに追加します" : "再生します"}`,
                            description: `${(guildQueue) ? "キューに追加します" : "プレイリストを再生します"}.\nプレイリスト名:${song.name.slice(0, 20)}\n曲数:${song.songs.length}\n\n-----最初の音楽----\nタイトル:${song.songs[0]?.name.slice(0, 20)}\n投稿者:${song.songs[0]?.author.slice(0, 20)}\nURL:[clieck_me](${song.songs[0]?.url})\n再生時間:${song.songs[0]?.duration}\n\n音量:${guildQueue?.options.volume || "100"}\nその他の音楽は/queueで確認してください`,
                            thumbnail: {
                                url: song.songs[0]?.thumbnail
                            },
                            color: 0x006400
                        }],
                        components: [option_button, option_button2, vol_select]
                    });
                } else {//プレイリストではなかった場合
                    let queue = client.player.createQueue(interaction.guildId);
                    await queue.join(interaction.member.voice.channel);
                    let song = await queue.play(search).catch(_ => {
                        interaction.followUp({
                            embeds: [{
                                color: 0xff1100,
                                title: "エラー",
                                description: '音楽が見つかりませんでした'
                            }]
                        });
                        if (!guildQueue)
                            queue.stop();
                    });
                    await interaction.followUp({
                        embeds: [{
                            title: `${(guildQueue) ? "キューに追加します" : "再生します"}`,
                            description: `${(guildQueue) ? "キューに追加します" : "この音楽再生します"}.\nタイトル:${song.name.slice(0, 20)}\n投稿者:${song.author.slice(0, 20)}\nURL:[clieck_me](${song.url})\n再生時間:${song.duration}\n音量:${guildQueue?.options.volume || "100"}`,
                            thumbnail: {
                                url: song.thumbnail
                            },
                            color: 0x006400
                        }],
                        components: [option_button, option_button2, vol_select]
                    });
                };
                //https://www.youtube.com/watch?v=hpibjIAiZHM&list=RDMMhpibjIAiZHM&start_radio=1
                //https://www.youtube.com/watch?v=-6po4gNBePA
            } else {//言葉の場合
                const r = await yts(search);
                const videos = r.videos.slice(0, 10);
                if (!videos) return interaction.followUp({
                    embeds: [{
                        color: 0xff1100,
                        title: "エラー",
                        description: '音楽が見つかりませんでした'
                    }]
                });
                let i = 1;
                const select_music = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('select_music')
                            .setPlaceholder('選択されていません')
                            .addOptions(videos.map(data => { return { "label": `[${i++}],${data.title.slice(0, 5)}`, value: data.videoId } })),
                    );
                i = 1;
                await interaction.followUp({
                    embeds: [{
                        title: `音楽選択`,
                        description: videos.map(data => `[${i++}],${data.title.slice(0, 30)}`).join("\n"),
                        color: 0x006400
                    }],
                    components: [select_music]
                });
            };
        };
        if (interaction.commandName == "remove") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            const remove = interaction.options.getNumber('remove');
            await guildQueue.remove(parseInt(remove));
            await interaction.reply({
                embeds: [{
                    title: `曲の削除`,
                    description: `${remove}番目の曲を削除しました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "get_queue") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            let i = 0;
            await interaction.reply({
                embeds: [{
                    title: `キューの詳細`,
                    description: guildQueue.songs.map(data => `[${i++}]${data.name}`).join("\n"),
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "skip") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.skip();
            await interaction.reply({
                embeds: [{
                    title: `曲のスキップ`,
                    description: `現在の曲をスキップしました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "stop") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.stop();
            await interaction.reply({
                embeds: [{
                    title: `曲の停止`,
                    description: `${interaction.user.tag}さんが曲を停止しました`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "remove_loop") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            guildQueue.setRepeatMode(RepeatMode.DISABLED);
            await interaction.reply({
                embeds: [{
                    title: `ループの解除`,
                    description: `ループを解除しました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "loop") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.setRepeatMode(RepeatMode.SONG);
            await interaction.reply({
                embeds: [{
                    title: `曲のループ`,
                    description: `現在のの音楽をループしました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "queue_loop") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.setRepeatMode(RepeatMode.QUEUE);
            await interaction.reply({
                embeds: [{
                    title: `キューのループ`,
                    description: `キュー内の音楽をループしました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "seek") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            const seek = interaction.options.getNumber('seek');
            await guildQueue.seek(parseInt(seek) * 1000);
            await interaction.reply({
                embeds: [{
                    title: `再生場所の指定`,
                    description: `再生場所を${parseInt(seek)}にしました。\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "shuffle") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.shuffle();
            await interaction.reply({
                embeds: [{
                    title: `シャッフル`,
                    description: `キュー内の曲をシャッフルしました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "resume") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            guildQueue.setRepeatMode(RepeatMode.DISABLED);
            await interaction.reply({
                embeds: [{
                    title: `ループの解除`,
                    description: `ループを解除しました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "pause") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.setPaused(true);
            await interaction.reply({
                embeds: [{
                    title: `曲の一時停止`,
                    description: `曲を一時停止しました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "now") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            const song = guildQueue.nowPlaying;
            try {
                this.queue = await guildQueue.createProgressBar()
            } catch (_) { };
            if (!song) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            interaction.reply({//guildQueue.nowPlaying
                embeds: [{
                    title: "現在の詳細",
                    description: `タイトル${song.name.slice(0, 40)}\n投稿者:${song.author.slice(0, 40)}\nURL:[click_me](${song.url})\n再生時間:${song.duration}\nライブか:${(song.isLive) ? "はい" : "いいえ"}\n現在の再生時間:\n${this.queue?.bar || "読み込めませんでした"}\n${this.queue?.times || "読み込めませんでした"}秒\n現在の音量:${guildQueue.volume}`,
                    image: {
                        url: song.thumbnail
                    },
                    color: 0x006400
                }]
            });
        };
        if (interaction.commandName == "volume") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            const vol = interaction.options.getNumber('volume');
            if (parseInt(vol) > 100) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "100以上の数字です",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.setVolume(parseInt(vol));
            await interaction.reply({
                embeds: [{
                    title: `音量の変更`,
                    description: `音量を${parseInt(vol)}にしました。\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
    };
    if (interaction.isSelectMenu()) {
        if (interaction.customId == "select_music") {
            await interaction.deferReply();
            const video = interaction.values[0];
            let queue = client.player.createQueue(interaction.guildId);
            await queue.join(interaction.member.voice.channel);
            let song = await queue.play(`https://youtube.com/watch?v=${video}`).catch(_ => {
                interaction.followUp({
                    embeds: [{
                        color: 0xff1100,
                        title: "エラー",
                        description: '音楽が見つかりませんでした'
                    }]
                });
                if (!guildQueue)
                    queue.stop();
            });
            await interaction.followUp({
                embeds: [{
                    title: `${(guildQueue) ? "キューに追加します" : "再生します"}`,
                    description: `${(guildQueue) ? "キューに追加します" : "この音楽再生します"}.\nタイトル:${song.name.slice(0, 20)}\n投稿者:${song.author.slice(0, 20)}\nURL:[clieck_me](${song.url})\n再生時間:${song.duration}\n音量:${guildQueue?.options.volume || "100"}\nリクエスト:${interaction.user.tag}`,
                    thumbnail: {
                        url: song.thumbnail
                    },
                    color: 0x006400
                }],
                components: [option_button, option_button2, vol_select]
            });
        };
        if (interaction.customId == "vol_select") {
            if (!guildQueue) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "音楽が再生されていません",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            const vol = interaction.values[0];
            await guildQueue.setVolume(parseInt(vol));
            await interaction.reply({
                embeds: [{
                    title: `音量の変更`,
                    description: `音量を${parseInt(vol)}にしました。\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
    };
    if (interaction.isButton()) {
        if (!guildQueue) return interaction.reply({
            embeds: [{
                title: "エラー",
                description: "音楽が再生されていません",
                color: 0xff1100
            }],
            ephemeral: true
        });
        if (interaction.customId == "vol_button") {
            await interaction.showModal(vol_modal);
        };
        if (interaction.customId == "seek_button") {
            await interaction.showModal(seek_modal);
        };
        if (interaction.customId == "stop_button") {
            await guildQueue.stop();
            await interaction.reply({
                embeds: [{
                    title: `曲の停止`,
                    description: `${interaction.user.tag}さんが曲を停止しました`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.customId == "queueloop_button") {
            await guildQueue.setRepeatMode(RepeatMode.QUEUE);
            await interaction.reply({
                embeds: [{
                    title: `キューのループ`,
                    description: `キュー内の音楽をループしました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.customId == "loop_button") {
            await guildQueue.setRepeatMode(RepeatMode.SONG);
            await interaction.reply({
                embeds: [{
                    title: `曲のループ`,
                    description: `現在のの音楽をループしました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.customId == "resume_button") {
            await guildQueue.setPaused(false);
            await interaction.reply({
                embeds: [{
                    title: `曲の再開`,
                    description: `曲の再生を再開しました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.customId == "skip_button") {
            await guildQueue.skip();
            await interaction.reply({
                embeds: [{
                    title: `曲のスキップ`,
                    description: `現在の曲をスキップしました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.customId == "pause_button") {
            await guildQueue.setPaused(true);
            await interaction.reply({
                embeds: [{
                    title: `曲の一時停止`,
                    description: `曲を一時停止しました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.customId == "stop_loop_button") {
            guildQueue.setRepeatMode(RepeatMode.DISABLED);
            await interaction.reply({
                embeds: [{
                    title: `ループの解除`,
                    description: `ループを解除しました\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
    };
    if (interaction.isModalSubmit()) {
        if (!guildQueue) return interaction.reply({
            embeds: [{
                title: "エラー",
                description: "音楽が再生されていません",
                color: 0xff1100
            }],
            ephemeral: true
        });
        if (interaction.customId == "vol_Modal") {
            const vol = interaction.fields.getTextInputValue('vol');
            const fot_vol = vol.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
            if (!parseInt(fot_vol)) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "数字ではなかったです",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            if (parseInt(fot_vol) > 100) return interaction.reply({
                embeds: [{
                    title: "エラー",
                    description: "100以上の数字です",
                    color: 0xff1100
                }],
                ephemeral: true
            });
            await guildQueue.setVolume(parseInt(fot_vol));
            await interaction.reply({
                embeds: [{
                    title: `音量の変更`,
                    description: `音量を${parseInt(fot_vol)}にしました。\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
        if (interaction.customId == "seek_Modal") {
            const seek = interaction.fields.getTextInputValue('seek');
            const fot_seek = seek.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
            await guildQueue.seek(parseInt(fot_seek) * 1000);
            await interaction.reply({
                embeds: [{
                    title: `再生場所の指定`,
                    description: `再生場所を${parseInt(fot_seek)}にしました。\nリクエスト:${interaction.user.tag}`,
                    color: 0x006400
                }]
            });
        };
    };
});
client.login(process.env.token)