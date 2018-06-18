
var SeamCarving = (function(){

    var imgData;
    var energyImgData;
    var energyData = [];

    var synthetise = true;

    var maxEnergy = 0;
    var computeEnergy = function(x, y) {

        var energy = 0;

        var energy_vertical = 0;
        var energy_horizontal = 0;

        // Filtre vertical
        var filter_vertical = [
            [-1, 0, 1],
            [-1, 0, 1],
            [-1, 0, 1],
        ];

        // Filtre horizontal
        var filter_horizontal = [
            [-1, -1, -1],
            [ 0,  0,  0],
            [ 1,  1,  1],
        ];

        //*/
        var sub_3x3 = (function(width,height) {

            var sub = Array.apply(null, Array(height)).map(function () { return new Array(width); });
            var min = Infinity;
            var max = -Infinity;

            for(dy = -parseInt(height/2); dy <= parseInt(height/2); ++dy)
            {
                for(dx = -parseInt(width/2); dx <= parseInt(width/2); ++dx)
                {
                    if(!(x+dx < 0 || x+dx >= imgData.width || y+dy < 0 || y+dy >= imgData.height))
                    {
                        var val = (imgData.data[(imgData.width*(y+dy) + x+dx)*4 + 0] +
                                    imgData.data[(imgData.width*(y+dy) + x+dx)*4 + 1] +
                                    imgData.data[(imgData.width*(y+dy) + x+dx)*4 + 2])/3
                        min = val < min ? val : min;
                        max = val > max ? val : max;
                        sub[1+dy][1+dx] = val;
                    }
                }
            }

            for(dy = 0; dy < height; ++dy)
                for(dx = 0; dx < width; ++dx)
                    sub[dy][dx] = 2*(sub[dy][dx]-0)/(255-0)-1;
                    //sub[dy][dx] = 2*(sub[dy][dx]-min)/(max-min)-1;


            return sub;

        })(3,3);
        //*/

        for(dy = 0; dy < 3; ++dy)
        {
            for(dx = 0; dx < 3; ++dx)
            {
                if(!(x-1+dx < 0 || x-1+dx >= imgData.width || y-1+dy < 0 || y-1+dy >= imgData.height))
                {
                    energy_vertical += filter_vertical[dy][dx]*sub_3x3[dy][dx];
                    energy_horizontal += filter_horizontal[dy][dx]*sub_3x3[dy][dx];
                }
            }
        }

        //console.log(filter_vertical, sub_3x3, Math.abs(energy_vertical/6));
        //die();

        energy += Math.abs(energy_vertical/6);
        energy += Math.abs(energy_horizontal/6);

        //energy = energy > 0.2 ? 1 : 0;

        energy /= 2;

        if(maxEnergy < energy)
            maxEnergy = energy;

        //return energy;
        energy = 0;

        var energy_contrast = 0;

        // --------------------------- Autre fonction :

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

            //return dist[0]*dist[0] + dist[1]*dist[1] + dist[2]*dist[2];
            return Math.sqrt(dist[0]*dist[0] + dist[1]*dist[1] + dist[2]*dist[2]);
        }

        if(x > 0)
        {
            energy_contrast += dist(x-1,y);
            nb++;
        }
        if(x < imgData.width-1)
        {
            energy_contrast += dist(x+1,y);
            nb++;
        }
        if(y > 0)
        {
            energy_contrast += dist(x,y-1);
            nb++;
        }
        if(y < imgData.height-1)
        {
            energy_contrast += dist(x,y+1);
            nb++;
        }

        energy_contrast /= nb*255;

        /*if(y > 0)
        {
            var legacy = energyData[imgData.width*(y-1)+x];
            if(x > 0)
                legacy = Math.min(legacy, energyData[imgData.width*(y-1)+x-1]);
            if(x < imgData.width-1)
                legacy = Math.min(legacy, energyData[imgData.width*(y-1)+x+1]);

            energy += legacy;
        }*/

        coef = .98;
        energy = coef*energy_contrast + (1-coef)*(energy_vertical+energy_horizontal);

        if(maxEnergy < energy)
            maxEnergy = energy;

        //console.log(energy);

        return energy; //255*(0.5*x/imgData.width + 0.5*y/imgData.height);
    }

    var synthetiseEnergyData = function() {
        for(var y = 1; y < imgData.height; ++y)
        {
            for(var x = 0; x < imgData.width; ++x)
            {
                var legacy = energyData[imgData.width*(y-1)+x];
                if(x > 0)
                    legacy = Math.min(legacy, energyData[imgData.width*(y-1)+x-1]);
                if(x < imgData.width-1)
                    legacy = Math.min(legacy, energyData[imgData.width*(y-1)+x+1]);

                energyData[imgData.width*y+x] += legacy;

                if(maxEnergy < energyData[imgData.width*y+x])
                    maxEnergy = energyData[imgData.width*y+x];
            }
        }
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

                //if(x > 2) die();
            }
            //die();
        }

        console.log(maxEnergy);

        if(synthetise)
            synthetiseEnergyData();

        console.log(maxEnergy);

        for(var y = 0; y < imgData.height; ++y)
        {
            for(var x = 0; x < imgData.width; ++x)
            {
                var energy = energyData[imgData.width*y + x];
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
