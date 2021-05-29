
const star = document.querySelector(".output");


document.getElementById("inputbox").value = "Range: 1~20";

document.getElementById("inputbox").onclick = function()
{
    if(document.getElementById("inputbox").value == "Range: 1~20")
        document.getElementById("inputbox").value = "";
}

document.getElementById("stippleButton").onclick = function()
{
    var n=parseInt(document.getElementById("inputbox").value);
    var starType=new Array(4);

    var s;
    if(1<=n && n<=20)   s=startext2(n, starType);
    else                s="Not a number or out of range";
    document.getElementById("outputtext").innerText=s;
}

function startext(n, starType)
{
    var t="";
    for(var i=0; i<n; i++)
    {
        for(var j=0; j<=i; j++)
        {
            t+="*";
        }
        t+="\n";
    }
    return t;
}

function startext2(n, starType)
{
    var a = new Array();
    for(var i=0; i<n; i++)
        a[i]=new Array(n);

    for(var i=0; i<n; i++)
    {
        for(var j=0; j<n; j++)
        {
            if(j>=i) a[i][j]='*';
            else a[i][j]=' ';
        }
    }

    for(var i=0; i<n; i++)
    {
        a[i]=a[i].join('');
    }
    return a.join('\n');
}

function init()
{
    1;
}

init();

document.addEventListener("keydown", e=>
{
    if(e.key=='Enter')
        if(document.activeElement==document.getElementById("inputbox"))
            document.getElementById("stippleButton").click();
})