const levels = [0, 200, 600, 1200, 2400, 4000]
for (let i = 5; i < 99; i++) {
    if (i >= 5 && i < 11) levels.push(levels[i] + 2000)
    else if (i >= 11 && i < 25) levels.push(levels[i] + 8000)
    else if (i >= 25 && i < 99) levels.push(levels[i] + 10000)
}

$(document).ready(() => {
    $("#result").hide()

    const formatNr = (value) => parseInt(value).toLocaleString("en-US")
    const showError = (message) => {
        $(".ui.form").removeClass("success").addClass("error")
        $("i.search.icon").remove()
        $("#automatic").addClass("error")
        $(".error.message").html(`<ul class="list"><li>${message}</li></ul>`)
    }
    const warning = {
        set toggle(boolean) {
            if (boolean === true) {
                $(".warning.message").text("This user hasn't earned any trophies or their profile is private")
                $(".warning.message").removeClass("hidden")
            } else {
                if (!$(".warning.message").hasClass("hidden")) return $(".warning.message").addClass("hidden")
                $(".warning.message").text()
            }
        }
    }

    const setLevelsPage = function(element) {
        const item = $(element)
        const page = item.attr("data-page")
        let range = []
        switch (page) {
            case "1":
                $("table#levels a.item").removeClass("active") 
                item.addClass("active")
                range = [0, 20]
                break
            case "2":
                $("table#levels a.item").removeClass("active") 
                item.addClass("active")
                range = [20, 40]
                break
            case "3":
                $("table#levels a.item").removeClass("active") 
                item.addClass("active")
                range = [40, 60]
                break
            case "4":
                $("table#levels a.item").removeClass("active") 
                item.addClass("active")
                range = [60, 80]
                break
            case "5":
                $("table#levels a.item").removeClass("active") 
                item.addClass("active")
                range = [80, 100]
                break
        }

        $("table#levels tbody").html(() => {
            let rows = ""
            for (let i = range[0]; i < range[1]; i++)
                rows += `<tr><td>${i+1}</td><td>${formatNr(levels[i])}</td></tr>`
            return rows
        })
    }

    setLevelsPage($("table#levels a.item[data-page=1]"))
    $("table#levels a.item").click(function(){setLevelsPage(this, false)})
    $("a#levels").click(() => $("table#levels").modal("show"))

    $("#calculate").click(async (e) => {
        const validatePSN = /^([a-zA-Z0-9-_]){3,16}$/
        $(".ui.form").form({
            fields: {
                psn: {
                    identifier: "psn",
                    optional: true,
                    rules: [{
                        type: "regExp",
                        value: /^([a-zA-Z0-9-_]){3,16}$/,
                        prompt: "Invalid PSN Name"
                    }]
                }
            },
            onSuccess: (e) => {
                e.preventDefault(e)
            }
        })
        
        let trophies = {
            platinum: 0,
            gold: 0,
            silver: 0,
            bronze: 0
        }

        warning.toggle = false

        if ($("input[name=psn]").val()) {
            if (!validatePSN.test($("input[name=psn]").val())) return $("#result").hide()
            $("#automatic .input.loading").append(`<i class="search icon"></i>`)

            const host = "https://psn-trophy-level-calculator.herokuapp.com"
            let res = await fetch(`${host}/users/${$("input[name=psn]").val()}/trophies`)

            if (await res.status !== 200) {
                console.error(await res.json())
                const update = await fetch(`${host}/users/${$("input[name=psn]").val()}/trophies/update`)
                if (await update.status !== 200) {
                    console.error(await update.json())
                    return showError("Unknown Error")
                }
                res = await fetch(`${host}/users/${$("input[name=psn]").val()}/trophies`) // try again
                if (await res.status !== 200) {
                    console.error(await res.json())
                    return showError("PSN name doesn't exist")
                }
            }

            const data = await res.json()

            trophies = {
                platinum: data.trophies.platinum,
                gold: data.trophies.gold,
                silver: data.trophies.silver,
                bronze: data.trophies.bronze
            }

            $("#automatic").transition("glow")
        } else {
            trophies = {
                platinum: $("input[name=platinum").val() || 0,
                gold: $("input[name=gold").val() || 0,
                silver: $("input[name=silver").val() || 0,
                bronze: $("input[name=bronze").val() || 0
            }

            $("#manual").transition("glow")
        }

        // Test values
        // trophies = {
        //     platinum: 5,
        //     gold: 32,
        //     silver: 141,
        //     bronze: 740
        // }

        const points = new Points(trophies.platinum, trophies.gold, trophies.silver, trophies.bronze)

        if (!trophies.platinum && !trophies.gold && !trophies.silver && !trophies.bronze) {
            console.error("Trophies not found")
            warning.toggle = true
        }
        
        $("#trophies #platinum").text(trophies.platinum)
        $("#trophies #gold").text(trophies.gold)
        $("#trophies #silver").text(trophies.silver)
        $("#trophies #bronze").text(trophies.bronze)

        $("#steps #current #level").text(points.currentLevel)
        $("#steps #current #points").text(formatNr(points.currentPoints))
        $("#steps #current #points2").text(formatNr(points.total))

        $("#progress").attr("data-value", points.total - points.currentPoints)
        $("#progress").attr("data-total", points.nextThree[0].points - points.currentPoints)
        $("#progress").progress()

        $("#steps #next #level").text(points.nextThree[0].level)
        $("#steps #next #points").text(formatNr(points.nextThree[0].points))
        $("#steps #next #points2").text(formatNr(points.nextThree[0].points - points.total))

        $("#steps #third #level").text(points.nextThree[1].level)
        $("#steps #third #points").text(formatNr(points.nextThree[1].points))
        $("#steps #third #points2").text(formatNr(points.nextThree[1].points - points.total))

        $("#steps #fourth #level").text(points.nextThree[2].level)
        $("#steps #fourth #points").text(formatNr(points.nextThree[2].points))
        $("#steps #fourth #points2").text(formatNr(points.nextThree[2].points - points.total))

        $("#result").transition("flash", "600ms")
        $("i.search.icon").remove()
    })

})

class Points {
    constructor(platinum, gold, silver, bronze) {
        this.platinum = 0
        this.gold = 0
        this.silver = 0
        this.bronze = 0
        this.total = 0

        this.calculate(platinum, gold, silver, bronze)
    }

    _platinum(amount) {
        this.platinum = amount * 180
        return this.platinum
    }

    _gold(amount) {
        this.gold = amount * 90
        return this.gold
    }

    _silver(amount) {
        this.silver = amount * 30
        return this.silver
    }

    _bronze(amount) {
        this.bronze = amount * 15
        return this.bronze
    }

    calculate(p, g, s, b) {
        this.total = this._platinum(p) + this._gold(g) + this._silver(s) + this._bronze(b)
        return this.total
    }

    get currentLevel() {
        return levels.indexOf(levels.find(pts => this.total < pts))
    }

    // minimum points required for the current level
    get currentPoints() {
        return levels[this.currentLevel - 1]
    }

    // minimum points required for the next level
    get nextPoints() {
        return levels.find(pts => this.total < pts)
    }

    get nextLevel() {
        return levels.indexOf(this.nextPoints) + 1
    }
    
    get nextThree() {
        let i = this.nextLevel - 1
        return [{
            level: i+1,
            points: levels[i]
        },
        {
            level: i+2,
            points: levels[i+1]
        },
        {
            level: i+3,
            points: levels[i+2]
        }]
    }
}