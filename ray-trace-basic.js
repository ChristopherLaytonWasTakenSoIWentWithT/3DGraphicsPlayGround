/**
 * Implementation of basic ray tracing algorithmn as defined in 
 *  Computer Graphics from Scratch
 *  - CL
 */
// Any representations of a vector = [x,y,z]
const BasicRayTrace = (canvasId, spheres, lights) => {
    const  canvas = document.getElementById(canvasId);
    const canvas_width = canvas.width;
    const canvas_height = canvas.height;

    const context = canvas.getContext("2d");

    const x_end = canvas_width /2
    const x_start = -1 * (x_end);

    const y_end = canvas_height / 2;
    const y_start = -1 * (y_end);

    const camera_position = [0,0,0];

    for(let x = x_start; x <= x_end; x++) {
        for(let y = y_start; y <= y_end; y++ ){
            const location = canvasToViewport([x,y],canvas_height, canvas_width);
            const color = traceRay(camera_position,location,1,9999999,spheres, lights);
            const r = color[0];
            const g = color[1];
            const b = color[2];
            const real_x = x + (canvas_width /2);
            const real_y = y + (canvas_height /2);
            context.fillStyle ="rgba("+r+","+g+","+b+","+(1)+")";
            context.fillRect(real_x,real_y,1,1);
        }
    }

}

const canvasToViewport = (coords, canvas_height, canvas_width) => {
    const distance = 1;
    return [
        //x
        coords[0] * 1 / canvas_width ,
        //y
        coords[1] * 1 / canvas_height,
        //z
        distance
    ]
}

const traceRay = (camera, location, minDistance, maxDistance, shperes, lights) => {
    let closest_t = Infinity;
    let closest_sphere = null;
    
    for(let i = 0; i < shperes.length; i++) {
        const sphere = shperes[i];
        const solutions = interesectRaySphere(camera, location, sphere);
        const t1 = solutions[0];
        const t2 = solutions[1];

        if((t1 >= minDistance && t1 <= maxDistance) && t1 < closest_t) {
            closest_t = t1;
            closest_sphere = sphere;
        }

        if((t2 >= minDistance && t2 <= maxDistance) && t2 < closest_t) {
            closest_t = t2;
            closest_sphere = sphere;
        }
    }

    if(closest_sphere === null){
        return [211,211,211];
    }
    const P = math.add(camera,math.multiply(closest_t,location));
    let N = math.subtract(P, closest_sphere.center);
    N = math.multiply(1 / LengthOfVector(N), N);
    const inten = computeLighting(P, N, lights, closest_sphere.specular, math.multiply(-1,location));
    return math.multiply(closest_sphere.color,inten);
}

const interesectRaySphere = (camera, location,sphere) => {
    const {radius, center} = sphere;
    const Camera_Sphere = subtractVectors(camera, center);
    
    const a = math.dot(location, location);
    const b = math.multiply(2,math.dot(Camera_Sphere,location));
    const c = math.subtract(math.dot(Camera_Sphere,Camera_Sphere), radius * radius);

    const discriminant = math.subtract(math.multiply(b,b),math.multiply(math.multiply(4,a),c));

    if(discriminant < 0) {
        return [
            Infinity,
            Infinity
        ]
    }
    return calculateQuadratic(b, discriminant,a);
}

const subtractVectors = (v1,v2) => {
    var result = [];
    for(let i = 0; i< v1.length; i++){
        result.push(v1[i] - v2[i]);
    }
    return result;
}

const calculateQuadratic = (b, discriminant,a) => {
    const neg_b = math.multiply(-1, b);
    const divisor = math.multiply(2,a);
    const t1_dividend = math.add(neg_b, Math.sqrt(discriminant));
    const t2_dividend = math.subtract(neg_b, Math.sqrt(discriminant));

    return [
        math.divide(t1_dividend,divisor),
        math.divide(t2_dividend, divisor)
    ]
}

const computeLighting = (point, normal, lights, specular, V) => {
    let intensity = 0.0;
    for(let i =0; i <lights.length;i++){
        const light = lights[i];
        if(light.type == "ambient") {
            intensity += light.intensity;
        } else {
            let L = null;
            if(light.type == 'point') {
                L = math.subtract(light.position, point);
            } else {
                L = light.direction;
            }
            let n_dot_l = math.dot(normal,L);
            if(n_dot_l > 0) {
                const top = math.multiply(light.intensity,n_dot_l);
                const bot = math.multiply(LengthOfVector(normal), LengthOfVector(L));
                intensity += (top / bot);
            }

            if(specular){
                const R = math.subtract(math.multiply(math.multiply(2,normal),math.dot(normal,L)),L);
                const r_dot_v = math.dot(R,V);
                if(r_dot_v > 0){ 
                    const bot = math.multiply(LengthOfVector(R), LengthOfVector(V));
                    const multiply = math.divide(r_dot_v, bot);
                    intensity+= math.multiply(light.intensity,math.pow(multiply,specular));
                }
            }
        }
    }
    return intensity;
}

const LengthOfVector = (vector) => {
    return math.sqrt(math.dot(vector,vector));
}