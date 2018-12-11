%% Disk kinematics

xSize = 50;
ySize = 90;
puckRadius = 2;
strikerRadius = 3.5;

th = 0:pi/50:2*pi;
xunitp = puckRadius * cos(th);
yunitp = puckRadius * sin(th);
xunits = strikerRadius * cos(th);
yunits = strikerRadius * sin(th);
inertia = .998;
elasticity = .9;
random = rand(1);
w = 0;
if w == 1
    vPuck = [0;30];
elseif w == 2
    vPuck = [0;-30];
else
    if random >= .5
        vPuck = [0;30];
    else
        vPuck = [0;-30];       
    end
end
    
pPuck = [xSize/2;ySize/2];
vStriker1 = [0;0];
pStriker1 = [xSize/3;ySize/2];
vStriker2 = [0;0];
pStriker2 = [2*xSize/3;ySize/2];
pCollision = [0;0];

pPuckNew = pPuck;

figure(1);
hold off;
plot(xunit+pPuck(1),yunit+pPuck(2))
axis equal
xlim([-puckRadius xSize+puckRadius])
ylim([-puckRadius ySize+puckRadius])

while (1)
    
    tic
    pause(.0001)
    t = toc;
    pPuckNew = pPuck + t*vPuck;
    
    col = 0;
    
    if pPuckNew(1) >= (xSize - puckRadius)
        col = 1;
        pPuck(1) = (xSize - puckRadius) - (pPuckNew(1) - (xSize - puckRadius));
        vPuck(1) = - vPuck(1);
    elseif pPuckNew(1) <= puckRadius
        col = 1;
        pPuck(1) = puckRadius - (pPuckNew(1) - puckRadius);
        vPuck(1) = - vPuck(1);
    end
    
    if pPuckNew(2) >= (ySize - puckRadius)
        col = 1;
        pPuck(2) = (ySize - puckRadius) - (pPuckNew(2) - (ySize - puckRadius));
        vPuck(2) = - vPuck(2);
    elseif pPuckNew(2) <= puckRadius
        col = 1;
        pPuck(2) = puckRadius - (pPuckNew(2) - puckRadius);
        vPuck(2) = - vPuck(2);
    end
    
    if (norm(pPuckNew - pStriker1)) <= (puckRadius + strikerRadius) && col == 0
        col = 1;
        pCollision(1) = (puckRadius*pPuck(1) + strikerRadius*pStriker1(1))/(puckRadius + strikerRadius);
        pCollision(2) = (puckRadius*pPuck(2) + strikerRadius*pStriker1(2))/(puckRadius + strikerRadius);
        vPuckTh = atan2(-vPuck(2),-vPuck(1));
        pCollisionTh = atan2(pCollision(2)-pStriker1(2),pCollision(1)-pStriker1(1));
        vPuckNewTh = pCollisionTh + (pCollisionTh - vPuckTh);
        vPuckMag = norm(vPuck);
        vPuck(1) = elasticity*(vPuckMag*cos(vPuckNewTh) + vStriker1(1));
        vPuck(2) = elasticity*(vPuckMag*sin(vPuckNewTh) + vStriker1(2));
        pPuckMag = norm(pPuckNew-pCollision);
        pPuck(1) = pCollision(1) + pPuckMag*cos(vPuckNewTh);
        pPuck(2) = pCollision(2) + pPuckMag*sin(vPuckNewTh);
        while (norm(pPuck - pStriker1)) <= (puckRadius + strikerRadius)
            pPuck(1) = pPuck(1) + strikerRadius*cos(vPuckNewTh)/10;
            pPuck(2) = pPuck(2) + strikerRadius*sin(vPuckNewTh)/10;
        end
    end
    
    if (norm(pPuckNew - pStriker2)) <= (puckRadius + strikerRadius) && col == 0
        col = 1;
        pCollision(1) = (puckRadius*pPuck(1) + strikerRadius*pStriker2(1))/(puckRadius + strikerRadius);
        pCollision(2) = (puckRadius*pPuck(2) + strikerRadius*pStriker2(2))/(puckRadius + strikerRadius);
        vPuckTh = atan2(-vPuck(2),-vPuck(1));
        pCollisionTh = atan2(pCollision(2)-pStriker2(2),pCollision(1)-pStriker2(1));
        vPuckNewTh = pCollisionTh + (pCollisionTh - vPuckTh);
        vPuckMag = norm(vPuck);
        vPuck(1) = elasticity*(vPuckMag*cos(vPuckNewTh) + vStriker2(1));
        vPuck(2) = elasticity*(vPuckMag*sin(vPuckNewTh) + vStriker2(2));
        pPuckMag = norm(pPuckNew-pCollision);
        pPuck(1) = pCollision(1) + pPuckMag*cos(vPuckNewTh);
        pPuck(2) = pCollision(2) + pPuckMag*sin(vPuckNewTh);
        while (norm(pPuck - pStriker2)) <= (puckRadius + strikerRadius)
            pPuck(1) = pPuck(1) + strikerRadius*cos(vPuckNewTh)/10;
            pPuck(2) = pPuck(2) + strikerRadius*sin(vPuckNewTh)/10;
        end
    end
    
    if col == 0
        pPuck = pPuckNew;
    end
        
    figure(1)
    plot(xunitp+pPuck(1),yunitp+pPuck(2))
    hold on
    plot(xunits+pStriker1(1),yunits+pStriker1(2))
    plot(xunits+pStriker2(1),yunits+pStriker2(2))
    hold off
    axis equal
    xlim([-puckRadius xSize+puckRadius])
    ylim([-puckRadius ySize+puckRadius])
    
    % inertia
    vPuck = inertia*vPuck;
    
end
