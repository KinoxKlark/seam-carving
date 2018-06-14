
var SeamCarving = (function(){

    var imgData;
    var energyImgData;
    var energyData = [];


    var maxEnergy = 0;
    var computeEnergy = function(x, y) {

        var energy = 0;
        var nb = 0;
        var self = [
            imgData.data[(imgData.width*y + x)*4 + 0],
            imgData.data[(imgData.width*y + x)*4 + 1],
            imgData.data[(imgData.width*y + x)*4 + 2],
        ];

        function dist(x,y)
        {
            var dist = [
                self[0] - imgData.data[(imgData.width*y + x)*4 + 0],
                self[1] - imgData.data[(imgData.width*y + x)*4 + 1],
                self[2] - imgData.data[(imgData.width*y + x)*4 + 2],
            ];

            return dist[0]*dist[0] + dist[1]*dist[1] + dist[2]*dist[2];
            //return Math.sqrt(dist[0]*dist[0] + dist[1]*dist[1] + dist[2]*dist[2]);
        }

        if(x > 0)
        {
            energy += dist(x-1,y);
            nb++;
        }
        if(x < imgData.width-1)
        {
            energy += dist(x+1,y);
            nb++;
        }
        if(y > 0)
        {
            energy += dist(x,y-1);
            nb++;
        }
        if(y < imgData.height-1)
        {
            energy += dist(x,y+1);
            nb++;
        }

        energy /= nb;

        if(y > 0)
        {
            var legacy = energyData[imgData.width*(y-1)+x];
            if(x > 0)
                legacy = Math.min(legacy, energyData[imgData.width*(y-1)+x-1]);
            if(x < imgData.width-1)
                legacy = Math.min(legacy, energyData[imgData.width*(y-1)+x+1]);

            energy += legacy;
        }

        if(maxEnergy < energy)
            maxEnergy = energy;

        //console.log(energy);

        return energy; //255*(0.5*x/imgData.width + 0.5*y/imgData.height);
    }

    var loadImage = function(img, width, height) {

        console.log(img.width, img.height);

        var scale = Math.min(width/img.width, height/img.height);
        scale=1; // On commence par enlever le système de mise à l'échelle

        var canvas = document.createElement('canvas');
        canvas.width = img.width*scale;
        canvas.height = img.height*scale;

        var ctx = canvas.getContext('2d');
        ctx.scale(scale,scale);
        ctx.drawImage(img, 0,0);

        imgData = ctx.getImageData(0,0,img.width, img.height);
        energyImgData = new ImageData(
            new Uint8ClampedArray(imgData.data),
            imgData.width,
            imgData.height
        )
        energyData = [];

        var minEnergyLastRow = Infinity;
        var minEnergyLastRowIdx;
        for(var y = 0; y < imgData.height; ++y)
        //for(var y = 0; y < 3; ++y)
        {
            for(var x = 0; x < imgData.width; ++x)
            //for(var x = 0; x < 3; ++x)
            {
                var energy = computeEnergy(x, y)
                energyData.push(energy);

                if(y == imgData.height-1 && minEnergyLastRow > energy)
                {
                    minEnergyLastRow = energy;
                    minEnergyLastRowIdx = x;
                }

                energyImgData.data[(imgData.width*y + x)*4 + 0] = 255*energy/maxEnergy; // R
                energyImgData.data[(imgData.width*y + x)*4 + 1] = 255*energy/maxEnergy; // G
                energyImgData.data[(imgData.width*y + x)*4 + 2] = 255*energy/maxEnergy; // B
            }
        }

        console.log(minEnergyLastRow, minEnergyLastRowIdx);

        var xSeam = minEnergyLastRowIdx;
        for(var ySeam = imgData.height-1; ySeam >= 0; --ySeam)
        {
            imgData.data[(imgData.width*ySeam + xSeam)*4 + 0] = 255; // R
            imgData.data[(imgData.width*ySeam + xSeam)*4 + 1] = 0; // G
            imgData.data[(imgData.width*ySeam + xSeam)*4 + 2] = 0; // B

            var nxtIdx;
            var nxtMin = Infinity;
            for(var i = -1; i <= 1; ++i)
            {
                if(xSeam+i >= 0 && xSeam+i < imgData.width)
                {
                    var nxt = energyData[imgData.width*(ySeam-1)+(xSeam+i)];
                    if(nxt < nxtMin)
                    {
                        nxtMin = nxt;
                        nxtIdx = xSeam+i;
                    }
                }
            }

            var xSeam = nxtIdx;
        }

        //console.log(energyData);
        //console.log(maxEnergy);
        //console.log(imgData);

        return true;
    };

    var getImageData = function()
    {
        return imgData;
    }
    var getEnergyImageData = function()
    {
        return energyImgData;
    }

    return {
        loadImage: loadImage,
        getImageData: getImageData,
        getEnergyImageData: getEnergyImageData,
    }
})();
